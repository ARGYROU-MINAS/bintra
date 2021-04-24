# bintra.py
#
# TBD

from dnfpluginscore import _, logger
import dnf
import dnf.cli
import os
import hashlib
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

    def pre_transaction(self):
        logger.info('In bintra pretransaction')
        #print(ppretty(self.base.transaction.install_set, indent='    ', width=40, seq_length=50, show_protected=False, show_static=False, show_properties=True, show_address=False))

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
            _family = p.vendor
            _path = p.repo.pkgdir + '/' + os.path.basename(p.relativepath)
            logger.info('Check version %s for architecture %s, family %s in temp path %s', _version, _arch, _family, _path)
            _hash = self._calcHash(_path)
            logger.info('Hash is %s', _hash)

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
