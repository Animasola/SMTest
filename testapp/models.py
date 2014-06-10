#-*- coding: UTF-8 -*-
from django.db import models
from django.contrib import admin

from testapp.utils import get_models_structure


def create_model(name, fields=None, app_label='', module='', options=None, admin_opts=None):
    """
    Create specified model
    """
    class Meta:
        pass

    # if app_label:
    #     setattr(Meta, 'app_label', app_label)

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
    admin_options = {
        'list_display': tuple(fields.keys()),
    }
    create_model(model_name, fields=fields, app_label='', module='testapp.models', admin_opts=admin_options)

# for model in dynamic_models:
#     dynamic_models[model].update({'__module__': "testapp.models"})
