jQuery(function ($) {
    var testapp = {};
    if (this.testapp !== undefined) {
        testapp = this.testapp;
    } else {
        this.testapp = testapp;
    }
    testapp.models_preview = {
        init:function(){
            testapp.models_preview.cacheElements();
            testapp.models_preview.bindEvants();
        },
        cacheElements:function(){
            testapp.models_preview.$content_block = $('div.content');
        },
        bindEvants:function(){
            $('.js-swith-model').on('click', testapp.models_preview.click_on_model_url);
        },
        click_on_model_url:function(e){
            e.preventDefault();
            $('table.js-table').remove();
            var table_name = $(this).attr("name"),
                $show_table = $("table[name=" + table_name + "]"),
                url = $(this).attr("href"),
                data = {};
            data['model_name'] = table_name;
            $.ajax({
                url: url,
                data: data,
                dataType: 'json'
            }).done(function (data){
              if (data['result'] == 'success') {
                var table_content = data['table_content'];
                var total_rows = table_content.length;
                testapp.models_preview.$content_block.append('<table class="js-table" name="' + table_name + '"> ')
                var $html_table = $('table.js-table');

                $.each(table_content, function(idx, value) {
                    var fields = value['fields'];
                    var row_class_name = table_name+'-'+value.pk;

                    if (idx == 0) {
                        $.each(fields, function(key, value){
                            $html_table.append('<th>'+key+'</th>')
                        });
                        $html_table.append('<tbody class="js-tbody"><tr class="'+row_class_name+'">')
                        var $row = $('tr.'+row_class_name);
                        $.each(fields, function(key, value){
                            $row.append('<td>'+value+'</td>')
                        });
                        $row.append('</tr>')
                    } else {
                        $html_table.append('<tr class="'+row_class_name+'">')
                        var $row = $('tr.'+row_class_name);
                        $.each(fields, function(key, value){
                            $row.append('<td>'+value+'</td>')
                        });
                        $row.append('</tr>')
                    }
                });
                $html_table.append('</tbody></table>')
              } else {
                alert('Error!');
              }
            });
        }

    };
    testapp.models_preview.init();
});