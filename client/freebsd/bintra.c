/*
 *
 */

/* Include other headers if needed */
#include <stdio.h>

/* Include pkg */
#include <pkg.h>

#include <syslog.h>

#include <curl/curl.h>

/* Define plugin name and configuration settings */
static const char PLUGIN_NAME[] = "bintra";
static const char CFG_JWT[] = "JWT";
static const char CFG_COUNT[] = "BADCOUNT";
static const char URL[] = "https://api.bintra.directory/v1/package?";
static const char ARG_name[] = "packageName";
static const char ARG_version[] = "packageVersion";
static const char ARG_arch[] = "packageArch";
static const char ARG_hash[] = "packageHash";

/* Maintain a reference to ourself */
static struct pkg_plugin *self;

int my_callback1(void *data, struct pkgdb *db);

/*
 * The plugin *must* provide an init function that is called by the library.
 *
 * The plugin's init function takes care of registering a hook in the library,
 * which is handled by the pkg_plugins_hook() function.
 *
 * Every plugin *must* provide a 'pkg_plugins_init_<plugin>' function, which is
 * called upon plugin loading for registering a hook in the library.
 *
 * The plugin's init function prototype should be in the following form:
 *
 * int pkg_plugins_init (void);
 *
 * No arguments are passed to the plugin's init function.
 *
 * Upon successful initialization of the plugin EPKG_OK (0) is returned and
 * upon failure EPKG_FATAL ( > 0 ) is returned to the caller.
 */
int
pkg_plugin_init(struct pkg_plugin *p)
{
	openlog("bintra", LOG_CONS|LOG_PID, LOG_LOCAL0);
	syslog(LOG_INFO, "Start plugin");

	/* Keep a reference to our plugin object, so it can be used inside the callback functions */
	self = p;

	/*
	 * Declare the plugin's metadata
	 *
	 * This information is shown by 'pkg plugins'.
	 *
	 */

	pkg_plugin_set(p, PKG_PLUGIN_NAME, PLUGIN_NAME);
	pkg_plugin_set(p, PKG_PLUGIN_DESC, "Bintra client for freeBSD");
	pkg_plugin_set(p, PKG_PLUGIN_VERSION, "1.0.0");

	/*
	 * Register configuration settings
	 *
	 * Declares
	 * - key (the name of the setting in the configuration file)
	 * - type (type of the setting, one of PKG_STRING, PKG_BOOL, PKG_INT, PKG_ARRAY)
	 * - default value (value if not set in the configuration file, provide empty string for no default)
	 *
	 */

	pkg_plugin_conf_add(p, PKG_STRING, CFG_JWT, "");
	pkg_plugin_conf_add(p, PKG_INT, CFG_COUNT, "0");

	/* Parse the configuration file for above settings. Do not forget this! */
	pkg_plugin_parse(p);

	/*
	 * Register two functions for hooking into the library
	 *
	 * my_callback1() will be triggered directly before any install actions are taken, which is
	 * specified by the PKG_PLUGINS_HOOK_PRE_INSTALL hook.
	 *
	 */

	/* printf(">>> Plugin '%s' is about to hook into pkgng.. yay! :)\n", pkg_plugin_get(p, PKG_PLUGIN_NAME)); */
	
	if (pkg_plugin_hook_register(p, PKG_PLUGIN_HOOK_PRE_INSTALL, &my_callback1) != EPKG_OK) {
		syslog(LOG_ERR, "Could not hook");
		pkg_plugin_error(p, "failed to hook into the library");
		return (EPKG_FATAL);
	}
	
	return (EPKG_OK);
}

/*
 * Plugins may optionally provide a shutdown function.
 *
 * When a plugin provides a shutdown function, it is called
 * before a plugin is being unloaded. This is useful in cases
 * where a plugin needs to perform a cleanup for example, or
 * perform any post-actions like reporting for example.
 *
 * The plugin's shutdown function prototype should be in the following form:
 *
 * int pkg_plugins_shutdown (struct pkg_plugin *);
 *
 * Upon successful shutdown of the plugin EPKG_OK (0) is returned and
 * upon failure EPKG_FATAL ( > 0 ) is returned to the caller.
 */
int
pkg_plugin_shutdown(struct pkg_plugin *p __unused)
{
	openlog("bintra", LOG_CONS|LOG_PID, LOG_LOCAL0);
	syslog(LOG_INFO, "shutdown plugin");
	closelog();

	/* printf(">>> Plugin '%s' is shutting down, enough working for today.. :)\n", pkg_plugin_get(p, PKG_PLUGIN_NAME)); */

	/*
	 * Perform any cleanup if needed, e.g.:
	 * 
	  if (tidy) {
	   	rc = perform_cleanup();
	   	if (rc != EPKG_OK)
	   		return (EPKG_FATAL);
	  }
	*/

	return (EPKG_OK);
}

static size_t read_callback(char *ptr, size_t size, size_t nmemb, void *stream)
{
  size_t retcode;
  curl_off_t nread;
 
  /* in real-world cases, this would probably get this data differently
     as this fread() stuff is exactly what the library already would do
     by default internally */ 
  retcode = fread(ptr, size, nmemb, stream);
 
  nread = (curl_off_t)retcode;
 
  fprintf(stderr, "*** We read %" CURL_FORMAT_CURL_OFF_T
          " bytes from file\n", nread);
 
  return retcode;
}

/*
 * And now we need to define our workers,
 * the plugin functions that carry out the real work.
 *
 * A plugin callback function must satisfy the following function pointer signature:
 *
 * int(*pkg_plugin_callback)(void *data, struct pkgdb *db);
 *
 * It should return EPKG_OK (0) on success and EPKG_FATAL ( > 0 ) on failure.
 *
 * Plugin callbacks must also take care of proper casting of the (void *data) argument.
 *
 * Depending on where a plugin hooks into the library the data passed to the callback is
 * different.
 *
 * For example if a plugin hooks into PKG_PLUGINS_HOOK_PRE_INSTALL the (void *data) passed to the
 * called is (struct pkg_jobs *), so the plugin callback must cast it explicitely.
 *
 * If the callback needs to access configuration data, a reference to the plugin object
 * can be kept in the global scope of this compilation unit:
 *
 * static struct pkg_plugin *self;
 *
 */
int
my_callback1(void *data, struct pkgdb *db)
{
	const char *jwt = NULL;
	int64_t count = 0;
	const pkg_object *cfg = NULL;
	pkg_iter it = NULL;
	CURL *curl;
	CURLcode res;
	struct curl_slist *curlheaders = NULL;
	char headbuf[300];

	openlog("bintra", LOG_CONS|LOG_PID, LOG_LOCAL0);
	syslog(LOG_INFO, "start pkg callback");

	/* Get configuration object */
	cfg = pkg_plugin_conf(self);

	/* Get configuration data */
	count = pkg_object_int(pkg_object_find(cfg, CFG_COUNT));
	jwt = pkg_object_string(pkg_object_find(cfg, CFG_JWT));

	pkg_plugin_info(self, "Hey, I was just called by the library, lets see what we've got here..");
	pkg_plugin_info(self, "  Token: '%s'", jwt);
	pkg_plugin_info(self, "  Count: %i", count);

	sprintf(headbuf, "Authorization: Bearer %s", jwt);

	if (data == NULL)
		pkg_plugin_info(self, "Hmm.. no data for me today, guess I'll just go and grab a mohito then..");
	else
		pkg_plugin_info(self, "Got some data.. okay, okay.. I'll do something useful then..");

	int64_t pkgSize = pkgdb_stats(db, PKG_STATS_LOCAL_SIZE);
	pkg_plugin_info(self, " package size %l", pkgSize);

	curl_global_init(CURL_GLOBAL_ALL);
	curl = curl_easy_init();
	if(!curl) {
		return (EPKG_FATAL);
	}
	curlheaders = curl_slist_append(curlheaders, "Content-Type: application/json");
	curlheaders = curl_slist_append(curlheaders, headbuf);
	curl_easy_setopt(curl, CURLOPT_HTTPHEADER, curlheaders);
	curl_easy_setopt(curl, CURLOPT_READFUNCTION, read_callback);
	curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "PUT");
	//curl_easy_setopt(curl, CURLOPT_POSTFIELDS, json_struct);
	curl_easy_setopt(curl, CURLOPT_URL, URL);
	res = curl_easy_perform(curl);
	if(res != CURLE_OK) {
		fprintf(stderr, "curl error: %s\n", curl_easy_strerror(res));
		syslog(LOG_ERR, "curl exec error: %s", curl_easy_strerror(res));
	}
	curl_slist_free_all(curlheaders);
	curl_easy_cleanup(curl);

	return (EPKG_OK);
}

