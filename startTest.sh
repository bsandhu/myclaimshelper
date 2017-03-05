echo 'Updating Electron deps'
sudo apt-get install build-essential clang libdbus-1-dev libgtk2.0-dev \
                       libnotify-dev libgnome-keyring-dev libgconf2-dev \
                       libasound2-dev libcap-dev libcups2-dev libxtst-dev \
                       libxss1 libnss3-dev gcc-multilib g++-multilib curl \
                       gperf bison


echo 'Starting Xfvb for Electron'
export DISPLAY=':99.0'
Xvfb :99 -screen 0 1366x768x24 > /dev/null 2>&1 &

export PORT=80
export ENV=TEST
echo 'Starting TEST ENV on Port 80'

node ./server/start.js 1>>server.out 2>>server.err &
