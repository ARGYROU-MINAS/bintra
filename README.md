# bintra

Binary Transparency

## Links and references

https://unix.stackexchange.com/questions/401126/run-a-command-before-after-ubuntu-apt-upgrade-unattended-upgrades

Use DPkg::Pre-Install-Pkgs to inject a precheck, run API calls to backend

## run local for testing

NODE_ENV=develop npm start

## add user manually

    docker exec -it bintra-nodejs bash
    root@bfedf154d642:/usr/src/app# npm run adduser USER PASSWD
    ^C