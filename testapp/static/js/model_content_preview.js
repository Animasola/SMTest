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
            $('body').on('keydown', testapp.models_preview.ctrl_enter_press);
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
                var field_types = data['field_types'];

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
                            $row.append('<td name="' + key + '" class="' + field_types[key] + '">'+value+'</td>')
                        });
                        $row.append('</tr>')
                    } else {
                        $html_table.append('<tr class="'+row_class_name+'">')
                        var $row = $('tr.'+row_class_name);
                        $.each(fields, function(key, value){
                            $row.append('<td name="' + key + '" class="' + field_types[key] + '">'+value+'</td>')
                        });
                        $row.append('</tr>')
                    }
                });
                $html_table.append('</tbody></table>')
                $('table.js-table').on('click', 'td', testapp.models_preview.display_td_input);
              } else {
                alert('Error!');
              }
            });
        },
        display_td_input:function() {
            var $cell = $(this),
                cellWidth = $cell.css('width'),
                prevContent = $cell.text(),
                new_val = '<input type="text" size="4" class="newValue" value="' + prevContent + '" />';
            $cell.addClass("updated-cell");
            $cell.html(new_val).find('input[type=text]').focus().css('width',cellWidth);


            testapp.models_preview.attach_widget($cell, prevContent);

            $cell.on('click', function(){return false});
            $cell.focusout(function () {
                if ($cell.find('.newValue').val() == prevContent ) {
                    $cell.text(prevContent);
                    $cell.removeClass("updated-cell");
                    $cell.off('click');
                    }
                });
            $cell.on('keydown',function(e) {
                if (e.keyCode == 27) {
                    $cell.text(prevContent);
                    $cell.removeClass("updated-cell");
                    $cell.off('click');
                }
            });
        },
        attach_widget:function(cell, prevContent) {
            if (cell.hasClass("IntegerField") || cell.hasClass("DecimalField") || cell.hasClass("FloatField")) {
                cell.find('.newValue').numeric({ negative: false }, function() { alert("No negative values"); this.value = ""; this.focus(); });
            } else { if (cell.hasClass("DateField")) {
                var date_input = cell.find('input.newValue'),
                    date_parts = prevContent.match(/(\d+)/g),
                    realDate = new Date(date_parts[0], date_parts[1] - 1, date_parts[2]);
                date_input.addClass("date-pick")
                }
            }
            $('.date-pick').each(function(){
                $(this).datepicker({
                    dateFormat: 'yy-mm-dd'
                })
            });
            var datepick = cell.find('.date-pick');
            datepick.datepicker("setDate", realDate)
            datepick.val("").datepicker("show")
        },
        ctrl_enter_press:function(e){
            if (e.ctrlKey && e.keyCode == 13) {
                testapp.models_preview.send_table_update()
            }
        },
        send_table_update:function() {
            var result = {},
                data = {};
            $('.updated-cell').each(function(){
                var val = "",
                    table_row_class = $(this).closest('tr').attr('class'),
                    model_name = table_row_class.split('-')[0],
                    object_id = table_row_class.split('-')[1],
                    field_name = $(this).attr('name');
                if (typeof data['model_name'] == 'undefined') {
                    data['model_name'] = model_name
                }

                val = $(this).find('.newValue').val()

                if (val == '') {
                    val = null
                }

                if (typeof result[object_id] == 'undefined') {
                    result[object_id] = {}
                }

                result[object_id][field_name] = val;
            });
            data['model_data'] = JSON.stringify(result)
            $.ajax({
                type: "POST",
                url: window.testapp.update_model_url,
                data: data,
                dataType: "json"
            })

        }
    };
    testapp.models_preview.init();
});