// Device prototype
// ----------------
function Device(name, type) {
	this.name = name;
	this.type = type;
	this.size = {width: 200, height: 200};
	this.id = Device.count++;

	this.expanded = true;
	this.ip = "192.168.0." + (this.id+1);
	this.static_ip = false;

	this.connections = [];
	this.n_children = 0;

	this.anchor = {
		"left": ($('#container').width() / 2 - this.size.width / 2),
		"top": ($('#container').height() / 2 - this.size.height / 2)
	}

	// Physics properties
	this.velocity = [0,0];
	this.mass = 1;
	this.target = [0,0];

	// Set content of device settings panel for Accordion Grid layout.	
	this.advanced_accordion_settings = getDeviceAccordionHTML( this );

	// Set content of device settings panel for Grid layout.
	this.advanced_settings = getDevicePanelHTML( this );
	
	//  for routers
	this.router_visibility = true;

	// for grid layout wireless icon
	if (this.type ==="wireless_network") this.password = "myP@$$w0rd!";

	this.addToDom();
}
Device.count = 0;
Device.prototype = {
	addToDom: function() {
		// Create an element and add it to the DOM
		this.el = $("<div><div class='badge'>0</div><div class='icon'></div><div class='info'><div class='name'>" + this.name + "</div><div class='status'></div></div></div>");
		this.el.addClass("device " + this.type + " invisible") // Start hidden
		this.el.attr("id", "device_" + this.id);
		this.el.offset(this.anchor);	
		$("#container").append(this.el);

		var thisthis = this;
		this.el.find(".name").click(function() { thisthis.editName(true);});

		// For a Wireless network icon (only used in grid layout) do this. NB: not to confuse with other wireless device type "wifi" used in physics layout.
		if (this.type === "wireless_network") {
			this.el.find(".name").after("<div class='password'>"+ this.password +"</div>");
			this.el.find(".password").click(function() { thisthis.editPassword(true);});
		}
	},
	// to show or hide details of a device in hovering pane on click
	showDetails: function (b_show) {
		
		if ( b_show === true ) {
			
			// If panel exists already for another device, then remove it first.
			var current_panel = $(".device_advanced_panel");
			if ( current_panel.length ) {
				var current_panel_id = current_panel.attr("id");
				var current_panel_device = $.grep(devices, function(device){ return device.id == current_panel_id; });
				current_panel_device[0].showDetails(false);
			}

			var new_panel = $("<div />").addClass("device_advanced_panel " + this.type);		// attach device name to as class so we know what device the panel is for.
			new_panel.attr("id", this.id);
			thisthis = this;
			var padding_topAndBottom = 20;
			var padding_leftAndRight = 50;

			// Bug fix found online: must wait 1 clock cycle (accomplished by the 0ms delay here) so that jQuery can succesfully retrieve the width of this newly created element. Otherwise it returns zero.
			setTimeout(function(){
				new_panel.css({
					"top": thisthis.el.offset().top - $("#container").offset().top,// - padding_topAndBottom,
					"left": ( (thisthis.el.offset().left - $("#container").offset().left) + thisthis.el.width()/2 - new_panel.width()/2 ) - padding_leftAndRight,
					// "padding-top": padding_topAndBottom,
					// "padding-bottom": padding_topAndBottom,
					"padding-left": padding_leftAndRight,
					"padding-right": padding_leftAndRight
				});
				// Addtional CSS for the Wireless Network device.
				if ( thisthis.type === "wireless_network" ) {
					new_panel.css({
						"top": thisthis.el.offset().top - $("#container").offset().top - padding_topAndBottom,
						"padding-top": padding_topAndBottom,
						"padding-bottom": padding_topAndBottom
					});
				}
			},0);
			new_panel.html(this.advanced_settings);
			new_panel.click(function() { thisthis.showDetails(false);});
			new_panel.prependTo("#container");
			new_panel.fadeIn( 400 );

		} else if ( b_show === false ) {
			var current_panel = $(".device_advanced_panel");
			current_panel.fadeOut( 400, function() {
				current_panel.remove();
			} );
		}
	},
	showName: function (b_show) {
		if ( b_show === true ) {
			this.el.find(".name").show();
		} else {
			this.el.find(".name").hide();
		}
	},
	moveTo: function(pos) {

	},
	show: function() {
		this.el.fadeIn(500);
	},
	hide: function() {
		this.el.fadeOut(500);
	},
	changeType: function(t) {
		
		var thisthis = this;
		var oldType = this.type;
		this.el.find(".icon").fadeOut({duration: 200, complete: function() {
			thisthis.el.removeClass(oldType);
			thisthis.el.addClass(t);
			thisthis.el.find(".icon").fadeIn({duration: 200});
			thisthis.type = t;
		}});

		// For Accordion Grid layout
		if ( $(".accordion").length ) {
			if (this.is_wireless) {
				var this_header = $("#wireless_accordion .accordion").find($("#wireless_accordion .accordion").accordion( "option", "header" ))
				    .eq(this.id_accordion);
				this_header.removeClass(oldType);
				this_header.addClass(t);
			} else {
				var this_header = $("#wired_accordion .accordion").find($("#wired_accordion .accordion").accordion( "option", "header" ))
				    .eq(this.id_accordion);
				this_header.removeClass(oldType);
				this_header.addClass(t);
			}
		}

	},
	highlight: function(state) {
		if(state == true) {
			this.el.addClass("highlight");
		}
		else {
			this.el.removeClass("highlight");
		}
	},
	toggleStatus: function() {
		var stat = this.el.find(".status");
		if(stat.is(":visible"))
			stat.slideUp();
		else {
			this.buildStatus();
			stat.slideDown();		
		}
	},
	update: function() {
		if(this.el) {
			// Update anchor position based on actual icon position
			var e = this.el.find(".icon");

			this.anchor = {left: e.offset().left + e.width() / 2,
						   top: e.offset().top + e.height() / 2};
		   // this.anchor = {left: e.position().left + e.width() / 2,
					// 	   top: e.position().top + e.height() / 2};

			// Set class based on whether this is expanded or not
			if(this.expanded) this.el.removeClass("collapsed");
			else this.el.addClass("collapsed");

		}

		// Update connections and count children
		this.n_children = 0;
		for(var i=0; i<this.connections.length; i++) {
			this.connections[i].update();
			if(this.connections[i].a == this) this.n_children++;
		}
		// display number of children nodes in this element's badge
		this.el.find(".badge").text(this.n_children);
		
		// hide this node if its a router
		if ( this.router_visibility === false ) {
			this.el.children().css("opacity", 0);
		} else {
			this.el.children().css("opacity", 1);
		}

		// Sometimes expanding nodes will make the page longer, and SVG lines won't draw below the edge of the screen unless we reset the document height on the SVG div.
		resetSvgDivHeight();

	},
	buildStatus: function() {
		this.el.find(".status").html("STATUS: ONLINE<br />IP " + (this.static_ip ? "(static)" : "(DHCP)") + ": <div class='ip_slot'>" + this.ip + "</div>");
	},
	expandSubnodes: function() {
		// if opening this node... 
        if ( this.expanded === false ) {
        	// close all device settings panels
        	$.each(devices, function(index, device) {
        		device.showDetails(false);
        	});
        	// close other open nodes first
        	$.each(routing_devices, function(index, other_dev) {
	            if ( other_dev.expanded === true && other_dev.name !== "Network Box" && other_dev.name !== "Wireless Network" ) {
	              other_dev.expanded = false;													// Set this to false so when its updated, it closes.
	              if ( other_dev.type === "router" ) this.router_visibility = true;				// Set to true so its icon is re-displayed once closed.
	              other_dev.update();
	            }
	        });
        	// hide this node if it is a router
        	if ( this.type === "router" ) this.router_visibility = false;
	        // then show my subnodes
			this.expanded = true;
			this.update();
        }
	},
	editName: function(state) {
		if(state == true) {
			var name_el = this.el.find(".name");
			name_el.after("<input type='text' class='edit_name' />");
			var edit_el = this.el.find(".edit_name");

			name_el.hide();

			edit_el.attr("value", this.name);
			edit_el.focus();

			var thisthis = this;
			edit_el.blur(function() {
				thisthis.editName(false);
			});
			edit_el.keydown(function(event) {
				if(event.keyCode == 13)
					thisthis.editName(false);
			});
		}
		if(state == false) {
			// Save new name in current object.
			this.name = this.el.find(".edit_name").val();
			// Update name in the DOM.
			this.el.find(".name").text(this.name);

			// For the Accordion Grid layout, here are additionnal places to change the device name.
			if ( $(".accordion").length ) {
				if (this.is_wireless) {
					// Find the wireless accordion header that has the same id_accordion as this object, and change the device name it's 'a' tag text.
					$("#wireless_accordion .accordion").find($("#wireless_accordion .accordion").accordion( "option", "header" ))
					    .eq(this.id_accordion)
					    .find($("a.header-name")).text(this.name);
					// Also change the device name in the panel content.
					$("#wireless_accordion .accordion .ui-accordion-content").eq(this.id_accordion).find($("input.content-name")).val(this.name);
				} else {
					// Find the wireless accordion header that has the same id_accordion as this object, and change it's 'a' tag text.
					$("#wired_accordion .accordion").find($("#wireless_accordion .accordion").accordion( "option", "header" ))
					    .eq(this.id_accordion)
					    .find($("a.header-name")).text(this.name);
					// Also change the device name in the panel content.
					$("#wired_accordion .accordion .ui-accordion-content").eq(this.id_accordion).find($("input.content-name")).val(this.name);
				}
			}

			this.el.find(".edit_name").hide();
			this.el.find(".name").show();
		}
	},
	editPassword: function(state) {
		if(state == true) {
			var name_el = this.el.find(".password");
			name_el.after("<input type='text' class='edit_password' />");
			var edit_el = this.el.find(".edit_password");

			name_el.hide();

			edit_el.attr("value", this.password);
			edit_el.focus();

			var thisthis = this;
			edit_el.blur(function() {
				thisthis.editPassword(false);
			});
			edit_el.keydown(function(event) {
				if(event.keyCode == 13)
					thisthis.editPassword(false);
			});
		}
		if(state == false) {
			this.password = this.el.find(".edit_password").val();
			// Update the DOM in the device area.
			this.el.find(".password").text(this.password);

			// For the Accordion Grid layout, 
			if ( $(".accordion").length ) {
				// Change the password in the panel content.
				$("#wireless_accordion .accordion .ui-accordion-content").eq(this.id_accordion).find($("input.content-password")).val(this.password);
			}

			this.el.find(".edit_password").hide();
			this.el.find(".password").show();
		}
	},
	distanceTo: function(b) {
		var dx = b.anchor.left - this.anchor.left;
		var dy = b.anchor.top - this.anchor.top;
		return Math.sqrt(dx*dx + dy*dy);
	},
	physicsDistanceTo: function(b) {
		var dx = b.target[0] - this.target[0];
		var dy = b.target[1] - this.target[1];
		return Math.sqrt(dx*dx + dy*dy);
	},
	physicsDistanceToSquared: function(b) {
		var dx = b.target[0] - this.target[0];
		var dy = b.target[1] - this.target[1];
		return Math.abs(dx*dx + dy*dy);
	},
	physicsVectorTo: function(b) {
		var dx = b.target[0] - this.target[0];
		var dy = b.target[1] - this.target[1];
		return [dx, dy];
	},

	die: function() {
		this.el.remove();
		$.each(this.connections, function(i, conn) {
			if(conn)
				conn.die();
		});

		this.connections.length = 0;
	}
}