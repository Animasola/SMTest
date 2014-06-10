SHELL=/bin/sh

# constants
PROJECT_NAME=dynmodels

MANAGE=PYTHONPATH=$(CURDIR) python manage.py

# commands
run:
	PYTHONPATH=`pwd` DJANGO_SETTINGS_MODULE=dynmodels.settings $(MANAGE) runserver

shell:
	PYTHONPATH=`pwd` DJANGO_SETTINGS_MODULE=dynmodels.settings $(MANAGE) shell
