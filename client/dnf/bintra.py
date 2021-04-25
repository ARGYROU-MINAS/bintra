# bintra.py
#
# CentOS / Redhat plugin for binarytransparency checking
# https://bintra.directory
# Version 1.0.3

from dnfpluginscore import _, logger
import dnf
import dnf.cli
import os
import hashlib
import requests
#from ppretty import ppretty

class Bintra(dnf.Plugin):
    name = 'bintra'
    JWT = ''
    session = requests.Session()

    def __init__(self, base, cli):
        super(Bintra, self).__init__(base, cli)
        logger.info('In bintra init')

    def config(self):
        cp = self.read_config(self.base.conf)
        self.JWT = cp.get('main', 'JWT')
        self.session.headers.update({
            'Authorization': 'Bearer ' + self.JWT,
            'User-Agent': 'bintra/1.0.0 (CentOS)'
        })

    @staticmethod
    def _calcHash(filename):
        sha256_hash = hashlib.sha256()
        with open(filename,"rb") as f:
            for byte_block in iter(lambda: f.read(4096),b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    @classmethod
    def _putPackage(self, query):
        logger.info(query)
        response = self.session.put("https://api.binarytransparency.net/v1/package", params=query)
        if response.status_code == 200:
            _j = response.json()
            logger.debug(_j)
            _replyLength = len(_j)
            if 1 == _replyLength:
                _entry = _j[0]
                _count = _entry['count']
                logger.info("We got one reply with %d, seems OK", _count)
            else:
                logger.error("Multiple matches (%d), be alarmed", _replyLength)
                raise dnf.exceptions.Error('Hash mismatch detected')
        else:
            print(response)
            logger.error("API failed")
            raise dnf.exceptions.Error('API failed')

    def pre_transaction(self):
        logger.info('In bintra pretransaction')

        _cmd = self.cli.command._basecmd
        logger.debug('Pre transaction command %s', _cmd)

        _theset = None

        if 'install' == _cmd:
            logger.debug('Handling command %s', _cmd)
            _theset = self.base.transaction.install_set
        elif 'upgrade' == _cmd:
            logger.debug('Handling command %s', _cmd)
#            print(ppretty(self.base.transaction, indent='    ', width=40, seq_length=50))
            _theset = self.base.transaction.install_set
        elif 'downgrade' == _cmd:
            logger.debug('Handling command %s', _cmd)
            _theset = self.base.transaction.install_set
        else:
            logger.debug('Skipping command %s', _cmd)
            return

        # loop over packages downloaded and to be installed
        for p in _theset:
            try: p.vendor
            except AttributeError: p.vendor='CentOS'

            _arch = p.arch
            _version = p.evr
            _pname = p.name
            _family = p.vendor
            _path = p.repo.pkgdir + '/' + os.path.basename(p.relativepath)

            if "Fedora Project" == _family:
                _family = "Fedora"

            logger.info('Check package %s, version %s for architecture %s, family %s in temp path %s', _pname, _version, _arch, _family, _path)

            _hash = self._calcHash(_path)
            logger.info('Hash is %s', _hash)
            _params = {
                'packageName': _pname,
                'packageVersion': _version,
                'packageArch': _arch,
                'packageFamily': _family,
                'packageHash': _hash
            }
            self._putPackage(_params)


@dnf.plugin.register_command
class BintraCommand(dnf.cli.Command):
    aliases = ('bintra',)
    msg = "Filter packages for matching hash codes"
    summary = _('List statistical data from binarytransparency plugin')
    usage = "Just run dnf as usual"

    def run(self):
        print("I'm alive")
