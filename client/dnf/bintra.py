# bintra.py
#
# TBD

from dnfpluginscore import _, logger
import dnf
import dnf.cli
import os
import hashlib
import requests
from ppretty import ppretty
from shutil import copyfile

class Bintra(dnf.Plugin):
    name = 'bintra'
    JWT = ''

    def __init__(self, base, cli):
        super(Bintra, self).__init__(base, cli)
        logger.info('In bintra init')

    def config(self):
        cp = self.read_config(self.base.conf)
        self.JWT = cp.get('main', 'JWT')

    @staticmethod
    def _calcHash(filename):
        sha256_hash = hashlib.sha256()
        with open(filename,"rb") as f:
            for byte_block in iter(lambda: f.read(4096),b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    @staticmethod
    def _putPackage(JWT, query):
        logger.info(query)
        _h = {
            'Authorization': 'Bearer ' + JWT
        }
        response = requests.put("https://api.binarytransparency.net/v1/package", params=query, headers=_h)
        if response.status_code == 200:
            print(response.json())
        else:
            print(response)
            logger.error("API failed")

    def pre_transaction(self):
        logger.info('In bintra pretransaction')
        #print(ppretty(self.base.transaction.install_set, indent='    ', width=40, seq_length=100, show_protected=False, show_static=False, show_properties=True, show_address=False))

        _cmd = self.cli.command._basecmd
        logger.debug('Pre transaction command %s', _cmd)
        logger.info('JWT still %s', self.JWT)

        if 'install' != _cmd:
            logger.info('Ignore command')
            return

        # loop over packages downloaded and to be installed
        _i = 0
        for p in self.base.transaction.install_set:
            _i = _i + 1
            _arch = p.arch
            _version = p.evr
            _pname = p.name
            _family = p.vendor
            _path = p.repo.pkgdir + '/' + os.path.basename(p.relativepath)
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
            self._putPackage(self.JWT, _params)

        # exit method:
        raise dnf.exceptions.Error('Stop for test')

    def transaction(self):
        logger.info('In bintra transaction')

@dnf.plugin.register_command
class BintraCommand(dnf.cli.Command):
    aliases = ('bintra',)
    msg = "Filter packages for matching hash codes"
    summary = _('List statistical data from binarytransparency plugin')
    usage = "Just run dnf as usual"

    def run(self):
        print("I'm alive")
