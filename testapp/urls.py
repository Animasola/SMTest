from django.conf.urls import patterns, url


urlpatterns = patterns(
    '',
    url(r'^$', 'testapp.views.preview_model_data', name='preview_model_data'),
)
