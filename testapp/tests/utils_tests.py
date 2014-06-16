 # -*-encoding: utf-8 -*-
from django.test.testcases import TestCase
from django.conf import settings
from django.db.models import fields

from lxml import etree

from testapp.utils import get_model_field_types, map_to_db_fields
from testapp.models import MODEL_NAMES


class UtilsTestCase(TestCase):
    def setUp(self):
        self.schema = etree.parse(settings.MODELS_SCHEMA_PATH)
        self.model_names = [
            model.attrib['name'] for model in self.schema.xpath('//schema/model')
        ]

    def test_parsed_models_structure(self):
        for model_name in self.model_names:
            self.assertTrue(model_name.lower() in MODEL_NAMES)
        for model in self.schema.xpath('//schema/model'):
            for field in model.getchildren():
                field_name = field.attrib['name']
                field_type_name = field.attrib['type']
                field_type = getattr(fields, field_type_name)

                result = map_to_db_fields(field.attrib)

                expected_result = {
                    field_name: field_type({'name': field_name, 'type': field_type})
                }

                self.assertEquals(result.keys(), expected_result.keys())
                self.assertEquals(
                    result[field_name].__class__.__name__,
                    expected_result[field_name].__class__.__name__
                )
