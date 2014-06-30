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
            testapp.models_preview.$status_msg = $('p.msg')
        },
        bindEvants:function(){
            $('.js-swith-model').on('click', testapp.models_preview.click_on_model_url);
            $('body').on('keydown', testapp.models_preview.ctrl_enter_press);
        },
        // Function that loads and shows model's records
        click_on_model_url:function(e, table_){
            var table_name = "",
                url = "",
                data = {};

            if (e != null) {
                e.preventDefault();
            }
            testapp.models_preview.$status_msg.fadeOut()
            $('table.js-table').remove()
            $('input.js-add-table-row').remove()
            url = $(this).attr("href")

            if (typeof table_ == 'undefined'){
                table_name = $(this).attr("name")
                url = $(this).attr("href")
            } else {
                table_name = table_
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

                // Building HTML do show table
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
                            var prop_val = "";
                            if (value == null) {
                                prop_val = ""
                            } else {prop_val = value}
                            $row.append('<td name="' + key + '" class="' + field_types[key] + '">'+prop_val+'</td>')
                        });
                        $row.append('</tr>')
                    } else {
                        $html_table.append('<tr class="'+row_class_name+'">')
                        var $row = $('tr.'+row_class_name);

                        $.each(fields, function(key, value){
                            var prop_val = "";
                            if (value == null) {
                                prop_val = ""
                            } else {prop_val = value}
                            $row.append('<td name="' + key + '" class="' + field_types[key] + '">'+prop_val+'</td>')
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
                testapp.models_preview.$status_msg.text("Error occured while trying to displaye table content.")
                testapp.models_preview.$status_msg.removeClass("info")
                testapp.models_preview.$status_msg.addClass("error")
                testapp.models_preview.$status_msg.fadeIn('slow')
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
            var $inp = $cell.find('input.newValue');

            // Except DateFields 'cause of mess with datepickers events
            $cell.focusout(function () {
                if ($cell.find('.newValue').val() == prevContent && !$cell.hasClass('DateField')) {
                    $cell.text(prevContent);
                    $cell.removeClass("updated-cell");
                    $cell.off('click');
                }

            });
            // For date values we'll use 'change' function
            $cell.change(function(){
                if ($cell.hasClass('DateField') && $cell.find('.newValue').val() == prevContent) {
                    $cell.text(prevContent)
                    $cell.removeClass('updated-cell')
                    $cell.off('click')
                }
            })
            // Press Esc
            $cell.on('keydown',function(e) {
                if (e.keyCode == 27) {
                    $cell.text(prevContent);
                    $cell.removeClass("updated-cell error-cell");
                    $cell.closest('tr').removeClass('failed-record');
                    $cell.off('click');
                }
            });
        },
        attach_widget:function(cell, prevContent) {
            // Using jquery.numeric plugin for numeric fields
            if (cell.hasClass("DecimalField") || cell.hasClass("FloatField")) {
                cell.find('.newValue').numeric({ negative: false }, function() { alert("No negative values"); this.value = "0.0"; this.focus(); });
            }

            if (cell.hasClass("IntegerField") ) {
                    cell.find('.newValue').numeric(false, function() { alert("Integers only"); this.value = "0"; this.focus(); });
                }
            // Using Datepicker for DateFields
            if (cell.hasClass("DateField")) {
                var date_input =  cell.find('input.newValue'),
                    date_parts = prevContent.match(/(\d+)/g);

                if (date_parts == null) {
                    var realDate = new Date();
                } else {
                    var realDate = new Date(date_parts[0], date_parts[1] - 1, date_parts[2]);
                }

                date_input.addClass("date-pick")
                }

            $('.date-pick').each(function(){
                $(this).datepicker({
                    dateFormat: 'yy-mm-dd',
                    onClose: function() {
                        cell.on('click', function(){return false});
                        if ($(this).val() == prevContent) {
                            cell.text(prevContent);
                            cell.removeClass('updated-cell error-cell')
                            cell.closest('tr').removeClass('failed-record')
                            cell.off('click')
                        }
                    }
                })
            });

            // Attaching validation function for EmailFields if any
            var datepick = cell.find('.date-pick');

            datepick.datepicker("setDate", realDate)
            datepick.val(prevContent).datepicker("show")
            if (cell.hasClass("EmailField")) {
                var email_input = cell.find('input.newValue');

                email_input.addClass('email-input')
            }
            $('.email-input').each(function() {
                $(this).keyup(function() {
                    if (!testapp.models_preview.valid_email($(this).val())) {
                        if (!cell.hasClass("error-cell")) {
                            cell.addClass("error-cell")
                        }
                    } else {
                        cell.removeClass("error-cell")
                    }
                });
            });

        },
        ctrl_enter_press:function(e){
            if (e.ctrlKey && e.keyCode == 13) {
                var model_name = $('table.js-table').attr('name');
                testapp.models_preview.send_table_update(model_name)
            }
        },
        // Grabbing new or updated values and sends to the server
        send_table_update:function(model_name) {
            var update = {},
                new_rows = [],
                data = {},
                $error_cells = $('td.error-cell');

            if ($error_cells.length) {
                testapp.models_preview.$status_msg.fadeOut()
                testapp.models_preview.$status_msg.addClass("error").text("Unable to save table. Some fields has incorrect values....")
                testapp.models_preview.$status_msg.removeClass("info")
                testapp.models_preview.$status_msg.fadeIn('slow')
                return false;
            }

            $('tr.failed-record').removeClass('failed-record');
            $('tr.js-new-entry').each(function(idx, row){
                $(row).attr('id', 'new_row-' + idx);
            });

            data['model_name'] = model_name
            $('.updated-cell').each(function(idx, cell){
                var val = "",
                    table_row_class = $(cell).closest('tr').attr('class'),
                    field_name = $(cell).attr('name');

                if ($(cell).closest('tr').hasClass('js-new-entry') == false) {
                    var object_id = table_row_class.split('-')[1],
                        cell_is_digit = $(cell).hasClass("IntegerField") || $(cell).hasClass("FloatField") || $(cell).hasClass("DecimalField"),
                        cell_is_email = $(cell).hasClass("EmailField");

                    val = $(cell).find('.newValue').val()
                    if (val == '' && cell_is_digit ) {
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
                    if (val == '' && cell_is_digit ) {
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
                    table_name = data['model_name'];
                if (result == 'success') {
                    testapp.models_preview.click_on_model_url(null, table_name)
                    testapp.models_preview.$status_msg.text("Data updated successfuly...")
                    testapp.models_preview.$status_msg.removeClass("error")
                    testapp.models_preview.$status_msg.addClass("info")
                    testapp.models_preview.$status_msg.fadeIn('slow')
                } else {
                    testapp.models_preview.$status_msg.text(data['err_msg'])
                    testapp.models_preview.$status_msg.removeClass("info")
                    testapp.models_preview.$status_msg.addClass("error")
                    testapp.models_preview.$status_msg.fadeIn('slow')

                    if (typeof data['failed-record'] != 'undefined'){
                        var err_row_class = data['failed-record'];
                        $('tr.' + err_row_class).addClass('failed-record')
                    }
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
        },
        valid_email:function (val) {
            var regex = new RegExp(/^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i),
                result = true;

            if (val.length > 0) {
                result = regex.test(val)
            }
            return result;
        }
    };
    testapp.models_preview.init();
});