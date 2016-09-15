The vips package is required.

On OSX:

`brew tap homebrew/science && brew install vips`

Ubuntu:

`apt-get install -y libvips`

To get up and running:

`source ./env && nvm use 6.2.2`

then,

`make setup`

(you only need to run setup after pulling changes)

You also need to have redis running on the default port, 6379.
Node that the tests will flush the redis database.

Once everything is installed, the app can be started with:

`make start`

To run the integration test:

`make test`

The TODO is up-to-date with the most important pending tasks.
