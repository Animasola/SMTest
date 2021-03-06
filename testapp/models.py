#-*- coding: UTF-8 -*-
from django.db import models
from django.db.models import signals
from django.contrib import admin
from django.contrib.auth.models import User

from testapp.utils import get_models_structure

MODEL_NAMES = []


def create_model(name, fields=None, app_label='', module='', options=None, admin_opts=None):
    """
    Create specified model.
    From https://code.djangoproject.com/wiki/DynamicModels#Ageneral-purposeapproach
    """
    class Meta:
        pass
    if app_label:
        setattr(Meta, 'app_label', app_label)
    if options is not None:
        for key, value in options.iteritems():
            setattr(Meta, key, value)
    attrs = {'__module__': module, 'Meta': Meta}
    if fields:
        attrs.update(fields)
    model = type(name, (models.Model,), attrs)
    if admin_opts is not None:
        class Admin(admin.ModelAdmin):
            pass
        for key, value in admin_opts.iteritems():
            setattr(Admin, key, value)
        admin.site.register(model, Admin)

    return model

dynamic_models = get_models_structure()

for model_name, fields in dynamic_models.iteritems():
    MODEL_NAMES.append(model_name.lower())
    admin_options = {
        'list_display': sorted(fields.keys()),
    }
    create_model(
        model_name,
        fields=fields,
        app_label='',
        module='testapp.models',
        admin_opts=admin_options)


# Костыль для деплоя на сервер, поскольку он не подтягивает фикстур.
def create_superuser(app, created_models, verbosity, **kwargs):
    if User.objects.all().count() == 0:
        User.objects.create_superuser("admin", "admin@mail.com", "admin")

signals.post_syncdb.connect(create_superuser, dispatch_uid='create_superuser')
