from django.conf import settings
from django.conf.urls import patterns, url


urlpatterns = patterns(
    '',
    url(r'^$', 'testapp.views.preview_model_data', name='preview_model_data'),
    url(r'^update_model/$', 'testapp.views.update_model', name='update_model'),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        url(r'^static/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.STATIC_ROOT}),
        url(r'^media/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.MEDIA_ROOT}),
)
