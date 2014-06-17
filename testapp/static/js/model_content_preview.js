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
        click_on_model_url:function(e, table_){
            var table_name = "",
                url = "",
                data = {};
            if (e != null) {
                e.preventDefault();
            }
            $('table.js-table').remove()
            $('input.js-add-table-row').remove()

            url = $(this).attr("href")

            if (typeof table_ == 'undefined'){
                table_name = $(this).attr("name")
                url = $(this).attr("href")
            } else {
                table_name = table_
                // url = "/testapp/?model_name=" + table_name
            }
            data['model_name'] = table_name

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
                            $html_table.append('<th name="'+key+'" class="background-grey">'+key+'</th>')
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

                $('div.content').append('<input class="js-add-table-row" type="button" value="Add New Row" />')
                $('input.js-add-table-row').click(function() {
                    testapp.models_preview.append_new_entry(data['field_types'], table_name)
                });

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
                var date_input =  cell.find('input.newValue'),
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
                var model_name = $('table.js-table').attr('name');
                testapp.models_preview.send_table_update(model_name)
            }
        },
        send_table_update:function(model_name) {
            var update = {},
                new_rows = [],
                data = {};
            $('tr.js-new-entry').each(function(idx, row){
                $(row).attr('id', 'new_row-' + idx);
            });
            data['model_name'] = model_name
            $('.updated-cell').each(function(idx, cell){
                var val = "",
                    table_row_class = $(cell).closest('tr').attr('class'),
                    field_name = $(cell).attr('name');

                if ($(cell).closest('tr').hasClass('js-new-entry') == false) {
                    var object_id = table_row_class.split('-')[1];

                    val = $(cell).find('.newValue').val()

                    if (val == '') {
                        val = null
                    }
                    if (typeof update[object_id] == 'undefined') {
                        update[object_id] = {}
                    }
                    update[object_id][field_name] = val;
                } else {
                    var row_id = $(cell).closest('tr').attr('id');

                    row_id = parseInt(row_id.split('-')[1])
                    model_name = table_row_class.split(' ')[1]

                    val = $(cell).find('.newValue').val()
                    if (val == '') {
                        val = null
                    }
                    if (typeof new_rows[row_id] == 'undefined') {
                        new_rows[row_id] = {}
                    }
                    new_rows[row_id][field_name] = val;
                }

            });

            data['update_data'] = JSON.stringify(update)
            data['new_objects_data'] = JSON.stringify(new_rows)
            $.ajax({
                type: "POST",
                url: window.testapp.update_model_url,
                data: data,
                dataType: "json"
            }).done(function(data){
                var result = data['result'],
                    table_name = "";
                if (result == 'success') {
                    table_name = data['model_name']
                    testapp.models_preview.click_on_model_url(null, table_name)
                } else {
                    alert("Something's went wrong :(")
                }
            });

        },
        append_new_entry:function(field_types, model_name) {
            var $table = $('table.js-table');
                $table_body = $table.find('.js-tbody'),
                headers = [];

            $table.find('th').each(function(idx, elem) {
                headers[idx] = $(elem).text()
            });

            $table_body.append('<tr class="js-new-entry '+model_name+'">')
            var $new_row = $table_body.find('tr.js-new-entry:last'),
                current_date = $.datepicker.formatDate('yy-mm-dd', new Date());

            $.each(headers, function(idx, value){
                if (field_types[value] == 'DateField') {
                    $new_row.append('<td name="' + value + '" class="' + field_types[value] + '">'+current_date+'</td>')
                } else {
                    $new_row.append('<td name="' + value + '" class="' + field_types[value] + '"></td>')
                }
            });
            $new_row.append('</tr>')
        }
    };
    testapp.models_preview.init();
});