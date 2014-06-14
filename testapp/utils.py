 #-*- coding: UTF-8 -*-
from lxml import etree

from django.conf import settings
from django.db.models import fields


TO_INT_ATTRS = ['max_length', 'max_digits', 'decimal_places']
TO_BOOL_ATTRS = ['null', 'blank']


def map_to_db_fields(field_attrs):
    """
    Mapping parsed field types to apropriate django model fields if it's possible.
    Accepts:
        :field_attrs: - <type 'lxml.etree._Attrib'>
    Returns:
        Dictionary e.g {'paycheck': <django.db.models.fields.DecimalField>}
    """
    attr_keys = field_attrs.keys()
    field_name = field_attrs[attr_keys.pop(attr_keys.index('name'))]
    field_type_raw = field_attrs[attr_keys.pop(attr_keys.index('type'))]

    # field_type - constructor for a django.db.models.fields objects
    try:
        field_type = getattr(fields, field_type_raw)
    except:
        raise Exception(
            "Can not create field with type {0}".format(field_type_raw))

    field_attributes = {}

    for key in attr_keys:
        if key in TO_INT_ATTRS:
            value = int(field_attrs[key])
        elif key in TO_BOOL_ATTRS:
            value = True if field_attrs[key] == 'true' else False
        else:
            value = field_attrs[key]

        field_attributes[key] = value

    return {field_name: field_type(**field_attributes)}


def get_models_structure():
    schema = etree.parse(settings.MODELS_SCHEMA_PATH)
    result = {}

    for model in schema.xpath('//schema/model'):
        fields = {}
        model_fields = model.getchildren()

        [fields.update(
            map_to_db_fields(field.attrib)) for field in model_fields]

        result.update({model.attrib['name']: fields})

    return result


def get_model_field_types(model):
    result = {}
    try:
        fields = model._meta.get_all_field_names()
        for field_name in fields:
            result[field_name] = model._meta.get_field(field_name).get_internal_type()
    except:
        raise Exception("Unable to get given model field types.")

    return result
