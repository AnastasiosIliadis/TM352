/* global plugin */

//Start of FR1.1//
 function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}
function isNumber(str) {
    return str.length === 1 && str.match(/[0-9]/);
}

function get_name_value(fieldName) {
    var value = $('#' + fieldName).val();
    
    if (fieldName === "salesperson") {
        if (!(isLetter(value.charAt(0)) && isNumber(value.charAt(value.length - 1)))) {
            alert("Please enter a valid Salesperson ID in the correct format");
            return "";
        }
    }
    return value;
}
//End of FR1.1//

//helper function for password
function get_pass_value(fieldName) {
    var value = $('#' + fieldName).val();
    if (value === "") {
		alert("Please enter a password");
		return "";
    }
    return value;
}

//helper function for client input
function get_client_value(fieldName) {
    var value = $('#' + fieldName).val();
    if (value === "") {
		alert("Please enter a Client ID");
		return "";
    }
    return value;
}

//helper function for quantity input
function get_quantity_value(fieldName) {
    var value = $('#' + fieldName).val();
    if (value === "" || value === "Quantity") {
		alert("Please enter a quantity");
		return "";
    }
    return value;
}

//helper function for discount input
function get_discount_value(fieldName) {
    var value = $('#' + fieldName).val();
    if (value === "" || value === "Discount") {
		return 0;
    }
    return value;
}

//helper function to convert pence to pounds
function convertToPounds (pence) {
	var priceReceived = (pence / 100);
	var price_in_pounds = priceReceived.toFixed(2);
	return price_in_pounds;
}
		
//helper function to get VAT total from an amount		
function vatAmount (vat, subtotal) {
	var result = (vat / 100) * subtotal;
	result = Math.round(result);
	return result;
}
		
//helper function to get discount amount in pence, rounding to nearest penny 		
function discountAmount (discount, price) {
	var result = (discount / 100) * price;
	result = Math.round(result);
	return result;
}

//helper function to convert a date to yyyy-mm-dd	
function convertDate (date) {
	var aDate = date.getDate();
	var aMonth = date.getMonth() + 1; 
	if (aMonth < 10) {
		aMonth = "0" + aMonth;
	} 
	var aYear = date.getFullYear();
	var convertedDate = (aYear + "-" + aMonth + "-" + aDate);
	return convertedDate;
}


// Main class

var app = {
    initialize: function() {
        this.bindEvents();
    },
    bindEvents: function() {
		
		//global variables
		var widgetNumber = 0;
		var widgetArrayLocation = 0;
		var order_id;
		var price;
		var lat;
		var lon;
		var newOrder = true;
		 
      function megaMaxSale() {

			//Start of FR1.2//
			this.previousWidget = function () {
				if (widgetNumber > 0)
				{				
					widgetNumber--;
				}
				else
				{
					alert("No more items");	
				}
				widgetArrayLocation = widgetNumber;
				UpdateWidgetDetails(widgetArrayLocation);
			};
			
			this.nextWidget = function () {
				if (widgetNumber < 9) 
				{
					widgetNumber++;
				}
				else
				{
					alert("No more items");	
				}
				widgetArrayLocation = widgetNumber;
				UpdateWidgetDetails(widgetArrayLocation);
			};
		 
		 
		function UpdateWidgetDetails(widgetArrayLocation) {
			var oucu = get_name_value('salesperson'); 
			var pass = get_pass_value('password');
			 
			 //RESTful API to get widget details
			$.get('http://137.108.92.9/openstack/api/widgets?OUCU='+ oucu + '&password=' + pass,
              function (data) {
                  var obj = $.parseJSON(data);
                  if (obj.status === "error") {
                      alert(obj.message);
                  } else {
						var image = document.getElementById("widget_image");
						image.style.display = "block";
						image.src = obj.data[widgetArrayLocation].url;

						var disc = obj.data[widgetArrayLocation].description;
						document.getElementById('description').innerHTML = disc;

						price = obj.data[widgetArrayLocation].pence_price;
						document.getElementById('price').value = "Price = " + price + "p";
					}
			  });
		 }
		//End of FR1.2//
		
		//Start of FR1.3//
		this.addToOrder = function () 
		{
			var oucu = get_name_value('salesperson'); 
			var pass = get_pass_value('password');
			var order = order_id;
			var widget_id = widgetNumber;
			var amount = get_quantity_value('quantity');
			var pence_price = price;
			var discount = get_discount_value('discount');
			var discountPence = discountAmount(discount, pence_price);
			var agreedPrice = pence_price - discountPence; 
			
			var url = "http://137.108.92.9/openstack/api/order_items";
                          $.ajax({
                              url: url,
                              type: 'POST',
                              data: {
								OUCU: oucu,
								password: pass,
								order_id: order,
								widget_id: widgetNumber+1,
								number: amount,
								pence_price: agreedPrice
                              },
                              success: function (result) {
									getOrderItems(oucu, pass, order);
                              }
                          }); 		
		};
		//End of FR1.3//
		
		//Start of FR1.4//
		function getOrderItems(oucu, pass, order) {

			$.get('http://137.108.92.9/openstack/api/order_items?OUCU='+ oucu + '&password=' + pass + '&order_id=' + order,
				function (data) {
					var obj = $.parseJSON(data);
					if (obj.status === "fail") {
							alert(obj.data[0].reason);
					} else {
						var list = "";
						var subtotal_pence = 0;
						document.getElementById("orderDetailsList").innerHTML = "";	
						
						$.each(obj.data, function (index, value) {
							var widgetInfo = value.widget_id;				
							var priceReceived = value.pence_price;
							var itemPrice = convertToPounds(priceReceived);	
							var numberOf = value.number;				
							var itemTotal_pence = numberOf * priceReceived;
							var itemTotal_pounds = convertToPounds(itemTotal_pence);			
							var result = numberOf + " x " + '(widget No ' + widgetInfo + ')' + ' x ' + '\u00A3' + itemPrice + ' = ';				
							
							list += "<li>" + result + '<div style="float:right;">' + '\u00A3' + itemTotal_pounds + '</div>' + "</li>";
							subtotal_pence += itemTotal_pence;
						});
						
						//adding VAT at 20%
						var vat = 20;
						var vatTotal_pence = vatAmount(vat, subtotal_pence);
						var vatTotal_pounds = convertToPounds(vatTotal_pence);
						var subtotal_pounds = convertToPounds(subtotal_pence);
						var grandTotal_pence = subtotal_pence + vatTotal_pence;
						var grandTotal_pounds = convertToPounds(grandTotal_pence);
										
						list += "<li>" + 'Subtotal:' +  '<div style="float:right;">' + '\u00A3' + subtotal_pounds + '</div>' + "</li>";
						list += "<li>" + 'VAT:' +  '<div style="float:right;">' + '\u00A3' + vatTotal_pounds + '</div>' + "</li>";
						list += "<li>" + '<strong>' +'Grand Total:' + '<div style="float:right;">' + '\u00A3' + grandTotal_pounds + '</div>' + '</strong>' + "</li>";
						$("#orderDetailsList").append(list);
					}
				}); 
		}
		//End of FR1.4//
		
		//get current location
		function load_position() {
			if (navigator.geolocation) {
					navigator.geolocation.getCurrentPosition(showPosition);
			} 
			else { 
				alert('Geolocation is not supported');
			}
		}
		
		function showPosition(position) {
			lat = position.coords.latitude;
			lon = position.coords.longitude;
		}
		
		this.newOrder = function () {
			if (newOrder === true) {
				newOrder = false;
				load_position();
				
				var lat1 = lat;
				var lon2 = lon;
				var oucu = get_name_value('salesperson'); 
				var pass = get_pass_value('password');
				var clientInput = get_pass_value('client_id');

				var url = "http://137.108.92.9/openstack/api/orders";
                          $.ajax({
                              url: url,
                              type: 'POST',
                              data: {
								OUCU: oucu,
								password: pass,
								client_id: clientInput,
								latitude: lat1,
								longitude: lon2
                              },
                              success: function (result) {
									
									var parsedData = $.parseJSON(result);
									order_id = parsedData.data[0].id;	
                              }
                          }); 
				//When salesperson login in to the system shows widgets 
				this.nextWidget();
			}
		};
		
		
		//Start of FR2.2//
		this.placeOrdersOnMap = function () {
			
			var oucu = get_name_value('salesperson'); 
			var pass = get_pass_value('password');
			var orderDate;
			var orderLat;
			var orderLon;
			var totalOrdersToday = 0;
			
			$.get('http://137.108.92.9/openstack/api/orders?OUCU='+ oucu + '&password=' + pass,
              function (data) {
                  var obj = $.parseJSON(data);
                  if (obj.status === "fail") {
                      alert(obj.data[0].reason);
                  } else {
						$.each(obj.data, function (index, value) {
							
							order = value.id;
							orderDate = value.date;
							orderLat = value.latitude;
							orderLon = value.longitude;
							
							var orderDate = new Date(orderDate);
							var convOrderDate = convertDate(orderDate);
							
							var todaysDate = new Date();
							var convTodaysDate = convertDate(todaysDate);
							
							if (convOrderDate === convTodaysDate) {
									totalOrdersToday ++;
							}	
						});
						alert('Total orders today, so far = ' + totalOrdersToday);

						updateMap(orderLat, orderLon);
						
						newOrder = true;
						document.getElementById("orderDetailsList").innerHTML = "";
						document.getElementById('client_id').value = "";
						document.getElementById('password').value = "";
						document.getElementById('salesperson').value = "";
						document.getElementById('quantity').value = "";
						document.getElementById('discount').value = "";
					}	
			  });
		};
		//End of FR2.2//		

		//Start of FR2,1//
		function updateMap(clientLat, clientLon) {
				  var onSuccess = function(position) {
                  var div = document.getElementById("map_canvas");
                  div.width = window.innerWidth-20;
                  div.height = window.innerHeight*0.38-40;
				  
				  var platform = new H.service.Platform({
				  app_id: "KYEa9G3DtKDEAkBXENgY", // TODO: Replace with your ID
				  app_code: "mHfIQCBybEcK-ZgEl85PRQ" // TODO: Replace with your CODE
					});
				  // obtain the default map types from the platform object
				  var defaultLayers = platform.createDefaultLayers();
				  // instantiate (and display) a map object:
				  var map = new H.Map(
					document.getElementById("map_canvas"),
					defaultLayers.normal.map
				  );

				  // optional: create the default UI:
				  var ui = H.ui.UI.createDefault(map, defaultLayers);
				  // optional: change the default settings of UI
				  var mapSettings = ui.getControl("mapsettings");
				  var zoom = ui.getControl("zoom");
				  var scalebar = ui.getControl("scalebar");
				  var panorama = ui.getControl("panorama");
				  panorama.setAlignment("top-left");
				  mapSettings.setAlignment("top-left");
				  zoom.setAlignment("top-left");
				  scalebar.setAlignment("top-left");

					 map.setZoom(15);  
					 var address;
					 var marker = null;

					function success(coordinates) 
					{
					  var firstResult = coordinates[0];
					  map.setCenter({lng:firstResult.clientLon, lat:firstResult.clientLat});
					}

					///openstreetmap area start///
					var osm_param = "https://nominatim.openstreetmap.org/search/"+ address +"?format=json&countrycodes=gb";
					$.get(osm_param,
					function (data) {
					var lat = data[0].clientLat;
					var lon = data[0].clientLon;});
					map.setCenter({lng:lon, lat:lat});
					//openstreetmap area end///
					  
					marker = new H.map.Marker(map.getCenter());
					map.addObject(marker);
				};
					var onError = function(error) {
					alert('code: ' + error.code + '\n' +'message: ' + error.message + '\n');
					};
					navigator.geolocation.getCurrentPosition(onSuccess, onError);
			}
			//End of FR2.1//
			
		load_position(); 
     } 
      this.megaMaxSale = new megaMaxSale();
    }    
};
app.initialize();
