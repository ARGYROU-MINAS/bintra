# bintra.py
#
# TBD

from dnfpluginscore import _, logger
import dnf
import dnf.cli
from ppretty import ppretty

class Bintra(dnf.Plugin):
    name = 'bintra'

    def __init__(self, base, cli):
        super(Bintra, self).__init__(base, cli)
        logger.info('In bintra init')

    def pre_transaction(self):
        logger.info('In bintra pretransaction')
        print(ppretty(self, indent='    ', width=40, seq_length=30, show_protected=False, show_static=False, show_properties=True, show_address=False))

        _cmd = self.cli.command._basecmd
        logger.debug('Pre transaction command %s', _cmd)

        if 'install' != _cmd:
            logger.info('Ignore command')
            return

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
