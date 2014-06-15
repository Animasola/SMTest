from django.views.decorators.http import require_POST, require_GET
from django.core.serializers.json import DjangoJSONEncoder
from django.core import serializers
from django.http import HttpResponse
from django.shortcuts import render
from django.db.models.loading import get_model

import json
from annoying.decorators import ajax_request

from testapp.models import MODEL_NAMES
from testapp.utils import get_model_field_types


@require_GET
def preview_model_data(request, model_name=None):
    response = {}
    if request.is_ajax():
        try:
            fetch_model_name = request.GET.get('model_name')
            model = get_model('testapp', fetch_model_name)
            queryset = model.objects.all()
            output = serializers.serialize('python', queryset)
            field_types = get_model_field_types(model)
            response.update({
                'table_content': output,
                'field_types': field_types,
                'result': 'success'})
        except:
            response.update({'result': 'error'})
        data = json.dumps(
            response,
            ensure_ascii=False,
            cls=DjangoJSONEncoder)
        return HttpResponse(data, mimetype='application/json')

    return render(
        request, 'testapp/home.html', {'models': MODEL_NAMES})


@ajax_request
@require_POST
def update_model(request):
    response = {'result': 'ok'}
    updated_data = None
    model_name = request.POST.get('model_name')
    if 'model_data' in request.POST and request.POST['model_data']:
        updated_data = json.loads(request.POST.get('model_data'))

    if model_name and updated_data:
        response['model_name'] = model_name
        try:
            requested_model = get_model('testapp', model_name)
            for instance_id, new_field_vals in updated_data.iteritems():
                requested_model.objects.filter(
                    id=instance_id).update(**new_field_vals)
        except:
            response['result'] = 'error'
    data = json.dumps(response, ensure_ascii=False)

    return HttpResponse(
        data, mimetype='application/json')
