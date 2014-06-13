from django.db.models.loading import get_model
from django.http import HttpResponse
from django.shortcuts import render
from django.core import serializers
from django.core.serializers.json import DjangoJSONEncoder
from django.views.decorators.http import require_POST, require_GET

import json
from annoying.decorators import ajax_request

from testapp.models import MODEL_NAMES


@require_GET
def preview_model_data(request, model_name=None):
    response = {}
    if request.is_ajax():
        try:
            fetch_model = request.GET.get('model_name')
            queryset = get_model('testapp', fetch_model).objects.all()
            output = serializers.serialize('python', queryset)
            response.update({
                'table_content': output,
                'result': 'success'})
        except:
            response.update({'result': 'error'})
        data = json.dumps(
            response,
            ensure_ascii=False,
            cls=DjangoJSONEncoder)
        return HttpResponse(data, mimetype='application/json')

    return render(
        request, 'testapp/home.html', {'models': MODEL_NAMES}
    )
