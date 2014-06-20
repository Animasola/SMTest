# -*-encoding: utf-8 -*-
from django.test.testcases import TestCase
from django.core.urlresolvers import reverse
from django.db.models.loading import get_model

import json

from testapp.models import MODEL_NAMES


class ViewsTestCase(TestCase):

    fixtures = ['initial_data.json']

    def setUp(self):
        self.client.login(username="admin", password="admin")

    def test_preview_model_data(self):
        # only GET requests should be allowed
        response = self.client.post(reverse('preview_model_data'))
        self.assertEquals(response.status_code, 405)

        # model names should be presented on page
        response = self.client.get(reverse('preview_model_data'))
        self.assertEquals(response.status_code, 200)
        for model_name in MODEL_NAMES:
            self.assertContains(response, model_name, status_code=200)

        # passing bad model name
        response = self.client.get(
            reverse('preview_model_data'),
            {'model_name': 'Pffff!'},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest')

        self.assertEquals(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue('result' in data)
        self.assertEquals(data['result'], 'error')

        for model_name in MODEL_NAMES:
            model = get_model('testapp', model_name)
            model_queryset = model.objects.all()
            response = self.client.get(
                reverse('preview_model_data'),
                {'model_name': model_name},
                HTTP_X_REQUESTED_WITH='XMLHttpRequest')
            self.assertEquals(response.status_code, 200)

            # view should return json dict with field_types
            # and table_content list of dictionaries
            data = json.loads(response.content)
            self.assertTrue('result' in data)
            self.assertEquals(data['result'], 'success')
            self.assertTrue('field_types' in data)
            self.assertTrue(isinstance(data['field_types'], dict))
            self.assertIsNotNone(data['field_types'])
            self.assertTrue('table_content' in data)
            self.assertTrue(isinstance(data['table_content'], list))

            # model queryset count should be equal to
            # table_content's len in response
            self.assertEquals(
                len(data['table_content']), model_queryset.count())

            # compare each field for each instance in db
            # with data in response
            for response_instance in data['table_content']:
                resp_instsnce_fields = response_instance['fields']
                model_instsnce = model_queryset.get(id=response_instance['pk'])
                for k, v in resp_instsnce_fields.iteritems():
                    self.assertEquals(
                        unicode(v),
                        unicode(getattr(model_instsnce, k, None))
                    )

    def test_update_model(self):
        bad_model_name = 'Pfff!'
        no_such_model_err = "No such table - {0}"
        response = self.client.get(reverse('update_model'))

        ajax_post_params = {
            'model_name': "",
            'new_objects_data': [],
            'update_data': {}
        }

        # only post requests allowed
        self.assertEquals(response.status_code, 405)

        # only ajax requests will be processed
        response = self.client.post(
            reverse('update_model'),
            {'model_name': 'user'})
        self.assertContains(response, 'Ajax Required', status_code=400)

        # bad model name
        response = self.client.post(
            reverse('update_model'),
            {'model_name': bad_model_name},
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEquals(response.status_code, 200)
        data = json.loads(response.content)
        self.assertTrue('result' in data)
        self.assertEquals(data['result'], 'error')
        self.assertTrue('err_msg' in data)
        self.assertEquals(
            no_such_model_err.format(bad_model_name),
            data['err_msg']
        )

        # with proper request and model names
        # updating
        for model_name in MODEL_NAMES:
            model = get_model('testapp', model_name)
            model_instsnce_1 = model.objects.all()[0]
            model_fields = model._meta.get_all_field_names()
            model_fields.pop(model_fields.index('id'))
            model_instsnce_2 = model.objects.all()[1]

            ajax_post_params['model_name'] = str(model_name)

            # updating model_instance_1 with values from model_instance_2
            fields_data = {}
            for field in model_fields:
                fields_data[field] = str(getattr(model_instsnce_2, field))
            ajax_post_params['update_data'] = json.dumps({
                str(model_instsnce_1.id): fields_data
            })
            response = self.client.post(
                reverse('update_model'),
                ajax_post_params,
                HTTP_X_REQUESTED_WITH='XMLHttpRequest'
            )

            self.assertEquals(response.status_code, 200)
            data = json.loads(response.content)
            self.assertTrue('result' in data)
            self.assertEquals(data['result'], 'success')

            model_instsnce_1 = model.objects.get(id=model_instsnce_1.id)
            model_instsnce_2 = model.objects.get(id=model_instsnce_2.id)

            # fields of these two instances now should be equal
            for field in model_fields:
                self.assertEquals(
                    unicode(getattr(model_instsnce_1, field)),
                    unicode(getattr(model_instsnce_2, field))
                )

        # creating new records
        ajax_post_params['update_data'] = {}

        for model_name in MODEL_NAMES:
            model = get_model('testapp', model_name)
            objects_count = model.objects.all().count()
            model_fields = model._meta.get_all_field_names()
            model_fields.pop(model_fields.index('id'))
            model_instsnce = model.objects.all()[0]

            ajax_post_params['model_name'] = str(model_name)

            new_record_data = {}
            for field in model_fields:
                new_record_data[field] = str(getattr(model_instsnce, field))
            ajax_post_params['new_objects_data'] = json.dumps([new_record_data])

            response = self.client.post(
                reverse('update_model'),
                ajax_post_params,
                HTTP_X_REQUESTED_WITH='XMLHttpRequest'
            )

            self.assertEquals(response.status_code, 200)
            data = json.loads(response.content)
            self.assertTrue('result' in data)
            self.assertEquals(data['result'], 'success')

            # One more record of current model in database now
            self.assertEquals(
                model.objects.all().count(),
                objects_count + 1
            )
