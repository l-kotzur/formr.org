function RunUnit( order )
{
    this.order = order;
	this.block = $('<div class="run_unit row"></div>');
	this.block.insertBefore($('#run_dialog_choices'));
}
RunUnit.prototype.init = function(content)
{
	this.block.htmlPolyfill($($.parseHTML(content))); // .html annoying but necessary, somewhere in here a clone where there should be none, appears
	this.position = this.block.find('.run_unit_position input.position');
	
	this.position_changed = false;
	this.position.change($.proxy(this.position_changes,this));
		
	this.dialog_inputs = this.block.find('div.run_unit_dialog input,div.run_unit_dialog select, div.run_unit_dialog button, div.run_unit_dialog textarea');
	this.unit_id = this.dialog_inputs.filter('input[name=unit_id]').val();
	this.run_unit_id = this.dialog_inputs.filter('input[name=run_unit_id]').val();
    this.block.attr('id',"unit_"+this.run_unit_id);
	this.dialog_inputs.on('input change',$.proxy(this.changes,this));
	this.save_inputs = this.dialog_inputs.add(this.position);
	
	// todo: file bug report with webshims, oninput fires only onchange for number inputs
	
	this.block.find('.hastooltip').tooltip({
		container: 'body'
	});
	this.block.find('.select2').select2();
	
	this.unsavedChanges = false;
	this.save_button = this.block.find('a.unit_save');
	this.save_button.removeClass('btn-info').attr('disabled', 'disabled').text('Saved')
	.click($.proxy(this.save,this));
	
	this.block.find('button.from_days')
	.click(function(e)
	{
		e.preventDefault();
		var numberinput = $(this).closest('.input-group').find('input[type=number]');
		var days = numberinput.val();
		numberinput.val( days * 60 * 24).change();
	});
	
	
	this.test_button = this.block.find('a.unit_test');
	this.test_button
	.click($.proxy(this.test,this));
	
	this.remove_button = this.block.find('button.remove_unit_from_run');
	this.remove_button
	.click($.proxy(this.removeFromRun,this))
	.mouseenter(function() {
		$(this).addClass('btn-danger');
	}).
	mouseleave(function(){
		$(this).removeClass('btn-danger');	
	});
    
    var textareas = this.block.find('textarea');
    if(textareas[0])
    {
        this.textarea = $(textareas[0]);
        this.session = this.hookAceToTextarea(this.textarea);
    }
    if(textareas[1])
    {
        this.textarea2 = $(textareas[1]);
        this.session2 = this.hookAceToTextarea(this.textarea2);
    }
};
RunUnit.prototype.position_changes = function (e) 
{
	if(!this.position_changed)
    {
        this.position_changed = true;
    	$run.reorder_button.addClass('btn-info').removeAttr('disabled');
    }
	this.position.parent().addClass('pos_changed');
};
RunUnit.prototype.changes = function (e) 
{
    if(!this.unsavedChanges) // dont touch the DOM for every change
    {
    	this.unsavedChanges = true;
    	this.save_button.addClass('btn-info').removeAttr('disabled').text('Unsaved changes…');
    	this.test_button.attr('disabled', 'disabled');
    }
};
RunUnit.prototype.test = function(e)
{
	e.preventDefault();
    var old_text = this.test_button.text();
	this.test_button.attr('disabled',true).html(old_text + ' <i class="fa fa-spinner fa-spin"></i>');
    
	var $unit = this.block;
	$.ajax(
		{
			url: $run.url + "/" + this.test_button.attr('href'),
			dataType: 'html',
			data: { "run_unit_id" : this.run_unit_id },
			method: 'GET'
		})
		.done($.proxy(function(data)
		{
			
			var $modal = $($.parseHTML('<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">                     <div class="modal-dialog">                         <div class="modal-content">                              <div class="modal-header">                                 <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>                                 <h3>Test result</h3>                             </div>                             <div class="modal-body">' + data + '  </div>                             <div class="modal-footer">                             <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>                         </div>                     </div>                 </div>'));

			$modal.modal('show').on('hidden.bs.modal',function() {
			    $modal.remove();
			});
            $(".opencpu_accordion").collapse({toggle:true});
            
        	this.test_button.html(old_text).removeAttr('disabled');
            var code_blocks = $modal.find('pre code');
            Array.prototype.forEach.call(code_blocks, hljs.highlightBlock);
//            $modal.find('#opencpu_accordion').on('hidden', function (event) {
//              event.stopPropagation()
//            });
		},this))
        .fail($.proxy(function(e, x, settings, exception) {
        	this.test_button.attr('disabled',false).html(old_text);
            ajaxErrorHandling(e, x, settings, exception);
        },this));
	return false;
};

RunUnit.prototype.save = function(e)
{
	e.preventDefault();
    
    var old_text = this.save_button.text();
	this.save_button.attr('disabled',true).html(old_text + ' <i class="fa fa-spinner fa-spin"></i>');

    if(this.session)
        this.textarea.val(this.session.getValue());
    if(this.session2)
        this.textarea2.val(this.session2.getValue());
    
	var $unit = this.block;
	$.ajax(
		{
			url: $run.url + "/" + this.save_button.attr('href'),
			dataType: 'html',
			data: this.save_inputs.serialize(),
			method: 'POST',
		})
		.done($.proxy(function(data)
		{
			$.proxy( this.init(data),this);
//        	this.save_button.html(old_text).removeAttr('disabled'); // not necessary because it's reloaded. should I be more economic about all this DOM and HTTP jazz? there's basically 2 situations where a reload makes things easier: emails where the accounts have been updated, surveys which went from "open" to "chose one". One day...
},this))
        .fail($.proxy(function(e, x, settings, exception) {
        	this.save_button.attr('disabled',false).html(old_text);
            ajaxErrorHandling(e, x, settings, exception);
        },this));
        
	return false;
};

// https://gist.github.com/duncansmart/5267653
// Hook up ACE editor to all textareas with data-editor attribute
RunUnit.prototype.hookAceToTextarea = function(textarea) {
   var mode = textarea.data('editor');

   var editDiv = $('<div>', {
       position: 'absolute',
       width: textarea.width(),
       height: textarea.height(),
       'class': textarea.attr('class')
   }).insertBefore(textarea);

   textarea.css('display', 'none');

//       ace.require("ace/ext/language_tools");

   this.editor = ace.edit(editDiv[0]);
   this.editor.setOptions({
       minLines: textarea.attr('rows') ? textarea.attr('rows') : 3,
       maxLines: 30
   });
   this.editor.setTheme("ace/theme/textmate");
   var session = this.editor.getSession();
   session.setValue(textarea.val());
   this.editor.renderer.setShowGutter(false);
   
   session.setUseWrapMode(true);
   session.setWrapLimitRange(42, 42);
   session.setMode("ace/mode/" + mode);
   
   this.editor.on('change',$.proxy(this.changes,this));
   
   return session;
};

RunUnit.prototype.removeFromRun = function(e)
{
	e.preventDefault();
    $(".tooltip").hide();
	var $unit = this.block;
    $unit.hide();
	$.ajax(
		{
			url: $run.url + "/" + this.remove_button.attr('href'),
			dataType: 'html',
			data: { "run_unit_id" : this.run_unit_id },
			method: 'POST'
		})
		.done(function(data)
		{
			$unit.html(data);
            $unit.show();
            $run.units = $run.units.splice(this.order, 1); // remove from the run unit list
		})
		.fail(function(e, x, settings, exception) {
            $unit.show();
            ajaxErrorHandling(e, x, settings, exception);
        });
	
	return false;
};

RunUnit.prototype.serialize = function()
{
    var arr = this.save_inputs.serializeArray();
    var myself = {};

    myself['type'] = this.block.find('.run_unit_inner').data('type');
    for(var i = 0; i<arr.length; i++)
    {
        if(arr[i].name != "unit_id" && arr[i].name != "run_unit_id" && arr[i].name.substr(0,8) != "position")
            myself[arr[i].name] = arr[i].value; 
        else if( arr[i].name.substr(0,8) == "position")
            myself['position'] = arr[i].value; 
    }
    return myself;
}

function Run()
{
	if(typeof autosaveglobal === 'undefined') {
		lastSave = $.now(); // only set when loading the first time
		autosaveglobal = false;
	}
    
    var $this = $('#edit_run');
    $this.submit(function(){ return false; });

	this.name = $('#run_name').val();
	this.url = $this.prop('action');
    
	this.units = [];
	var json_units = $.parseJSON($this.attr('data-units'));

    for(var i = 0; i < json_units.length; i++)
    {
        this.units[ i ] = new RunUnit( i );
        this.loadUnit(json_units[i], i);
    }

	$this.find('a.add_run_unit').click(this.addUnit);
	$this.find('a.run-toggle').click(this.ajaxifyToggle);
    
	this.exporter_button = $this.find('a.export_run_units');
    this.exporter_button.click($.proxy(this.exportUnits, this));

    this.reorder_button = $this.find('a.reorder_units');
	this.reorder_button
    .attr('disabled', 'disabled')
    .click($.proxy(this.reorderUnits, this));

	window.onbeforeunload = function() {
		var message = false;
		$($run.units).each(function(i, elm)
		{
			if(elm.position_changed || elm.unsavedChanges)
			{
				message = true;
				return false;
			}
		});
		if (message ) {
			return 'You have unsaved changes.'
		}
	};

}
Run.prototype.loadUnit = function(json_data, order)
{
	$.ajax( 
	{
		url: this.url + '/ajax_get_unit',
		data: json_data,
		dataType:"html", 
		success: $.proxy(function (data, textStatus) 
		{
            this.units[ order ].init(data);
		},this)
	});
}

Run.prototype.addUnit  = function(e) 
{
    e.preventDefault();
	var positions = $('.run_unit_position input:visible').map(function() { 
		return +$(this).val();
	}); // :visible in case of webshims. 
	var positions = $.makeArray(positions);
	var max = positions.slice().sort(function(x,y){ return x-y; }).pop(); // get maximum by sorting and popping the last elm. slice to copy (and later reuse) array

    var new_unit_order = $run.units.length;
    $run.units.push(new RunUnit(new_unit_order));
    
	$.ajax( 
	{
		url: $(this).attr('href'),
		dataType:"html",
		method: 'POST',
		data: 
		{
			position: max + 1
		}
	})
	.done(function(data)
	{
		$run.units[ new_unit_order ].init(data);
	})
	.fail(ajaxErrorHandling);
    return false;
}


Run.prototype.exportUnits = function()
{
    var units = {};
    for(var i = 0; i < this.units.length; i++)
    {
        var unit = this.units[i].serialize();
        units[unit.position] = unit;
    }
    var json = JSON.stringify(units, null, "\t");
	var $modal = $($.parseHTML('<div class="modal fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">                     <div class="modal-dialog">                         <div class="modal-content">                              <div class="modal-header">                                 <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>                                 <h3>JSON export of modules</h3>                             </div>                             <div class="modal-body"><h4>Click to select</h4><pre><code class="hljs json">' + json + '</code></pre></div>                             <div class="modal-footer">                             <button class="btn" data-dismiss="modal" aria-hidden="true">Close</button>                         </div>                     </div>                 </div>'));

	$modal.modal('show').on('hidden.bs.modal',function() {
	    $modal.remove();
	});
    var code_block = $modal.find('pre code');

    hljs.highlightBlock(code_block.get(0));
    code_block.on('click', function(e){
        if (document.selection) {
            var range = document.body.createTextRange();
            range.moveToElementText(this);
            range.select();
        } else if (window.getSelection) {
            var range = document.createRange();
            range.selectNode(this);
            window.getSelection().addRange(range);
        }
    });
}

Run.prototype.reorderUnits  = function(e) 
{
	e.preventDefault();
	if(typeof this.reorder_button.attr('disabled') === 'undefined')
	{
		var positions = {};
        var are_positions_unique = [];
        var pos;
        var dupes = false;
		$(this.units).each(function(i,elm) {
            
            pos = +elm.position.val();
            
            if($.inArray(pos,are_positions_unique)>-1)
            {
            	bootstrap_alert("You used the position "+pos+" more than once, therefore the new order could not be saved. <a href='#unit_"+elm.unit_id+"'>Click here to scroll to the duplicated position.</a>", 'Error.','.main_body');
                dupes = true;
//                    return;
            }
            else
            {
				positions[elm.run_unit_id] = pos;                    
                are_positions_unique.push(pos);
            }
		});
        if(!dupes)
        {
			$.ajax( 
			{
				url: this.reorder_button.attr('href'),
				dataType:"html",
				method: 'POST',
				data: {
					position: positions
				}
			})
			.done(function(data)
			{
				$(this.units).each(function(i,elm) {
					elm.position_changed = false;
				});
				this.reorder_button.removeClass('btn-info').attr('disabled', 'disabled');
				var old_positions = $.makeArray($('.run_unit_position input:visible').map(function() { return +$(this).val(); }));
				var new_positions = old_positions;
				old_positions = old_positions.join(','); // for some reason I have to join to compare contents, otherwise annoying behavior with clones etc
				new_positions.sort(function(x,y){ return x-y; }).join(',');
			
				if(old_positions != new_positions)
				{
					location.reload();
				} else
				{
					$('.pos_changed').removeClass('pos_changed');
				}
			})
			.fail(ajaxErrorHandling);
			return false;
        }
	}
}
Run.prototype.lock = function()
{
    var on = !!$("#edit_run").find('.lock-toggle').hasClass("btn-checked");
    $("#edit_run").find('.position, .remove_unit_from_run, .reorder_units, .unit_save, .form-control, select').each(function (i, elm)
    {
        if(on)
        {
            
            if(elm.onclick)
            {
                elm.onclick_disabled = elm.onclick;
                elm.onclick = function(e) { e.preventDefault(); return false; };
            }
            $(elm).attr('data-old_disabled', $(elm).attr('disabled') );
            $(elm).attr('disabled','disabled');
        } else // if enabled, set back to default
        {
            if(elm.onclick_disabled) // if there was a default
                elm.onclick = elm.onclick_disabled;
            if($(elm).attr('data-old-disabled') && $(elm).attr('data-old-disabled') != '')
                $(elm).attr('disabled', $(elm).attr('data-old-disabled'));
            else
                $(elm).removeAttr('disabled');
        }

        
    });
}


Run.prototype.ajaxifyToggle = function(e)
{
    var $this = $(this);
	var on = (! $this.hasClass('btn-checked') ) ? 1 : 0;
	$this.toggleClass('btn-checked',on);
	$.ajax( 
	{
		url: $this.attr('href'),
		dataType:"html",
		method: 'POST',
		data: {
			on: on
		}
	})
	.fail(ajaxErrorHandling);
	return false;
    
}

$(document).ready(function () {
    $run = new Run();
});