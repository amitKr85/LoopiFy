window.addEventListener("DOMContentLoaded",function(){

	function console_log(msg){

		document.getElementById('console').textContent = msg;
	}
	function console_clear(){
		document.getElementById('console').textContent = '';
	}

	var patternToFind="https://www.youtube.com/watch?";
	/* check for url */
	browser.tabs.query({active: true, currentWindow: true}).then(function(tabs){

		/** if not correct url **/
		if(tabs[0].url.indexOf(patternToFind)==-1){

			document.getElementById('content').style.display = 'none';
			console_log('not compatible with the url.');

		} /** if correct url **/
		else{

			var vDuration=0;
			var loopStart=0;
			var loopEnd=0;
			var lastInput=new Date();

			var lastEnableCall=null,okToEnable=true;

			function enableToggle(){
				document.getElementById('toggle_button').className = "enabled";
				document.getElementById('toggle_dot').className = "enabled";
				document.getElementById('toggle_text').textContent = "Disable for current video";

				$('#mask').animate({
					'opacity':'0'},
					200, function() {
					this.removeAttribute('style');
					this.className = "disabled";
				});

			}
			function disableToggle(){
				document.getElementById('toggle_button').className = "disabled";
				document.getElementById('toggle_dot').className = "disabled";
				document.getElementById('toggle_text').textContent = "Enable for current video";

				$('#mask').css({'opacity':'0','display':'block'}).animate({
					'opacity':'1'},
					200, function() {
					this.removeAttribute('style');
					this.className = "enabled";
				});

			}

			function getInputTime(classVal){
				var currVal=0;
				if($('input.hours').length>0){
					currVal+=$('input.hours.'+classVal).eq(0).val()*3600;
				}
				if($('input.minutes').length>0){
					currVal+=$('input.minutes.'+classVal).eq(0).val()*60;
				}
				currVal+=$('input.seconds.'+classVal).eq(0).val()*1;

				return currVal;
			}

			function setInputTime(classVal,timeVal){
				if($('input.hours').length>0)
					$('input.hours.'+classVal).eq(0).val(Math.floor(timeVal/3600));
				if($('input.minutes').length>0)
					$('input.minutes.'+classVal).eq(0).val(Math.floor((timeVal/60)%60));
				$('input.seconds.'+classVal).eq(0).val(Math.floor(timeVal%60));

			}

			function updateEndPoints(durationVal,startVal,endVal){
				var seekerWidth=$('#seeker').outerWidth();
				$('#duration_seeker').css({
					'left': Math.floor((startVal/durationVal)*seekerWidth),
					'width': Math.floor(((endVal-startVal)/durationVal)*seekerWidth)
				});

				setInputTime('start_t',startVal);
				setInputTime('end_t',endVal);

				/* if end_time is going out of view port */
				if($('#duration_seeker').css('left').replace("px","")*1+$('#duration_seeker').width()+10<$('#end_t').width()){
					$('#end_t').css('right',-1*($('#end_t').width()-( $('#duration_seeker').css('left').replace("px","")*1+$('#duration_seeker').width() )));
				}else{
					$('#end_t').removeAttr('style');
				}
				/* if start_time is going out of view port */
				if($('#duration_seeker').css('left').replace("px","")*1+$('#start_t').width()>$('#seeker').width()+10){
					$('#start_t').css('left',-1*( $('#duration_seeker').css('left').replace("px","")*1+$('#start_t').width()-$('#seeker').width() ));
				}else{
					$('#start_t').removeAttr('style');
				}

			}

			/* to send enable mess. to content_Script */
			function sendEnableMessage(){

				if($('.times').hasClass('invalid')){

					return;
				}
				/* getting values */
				loopStart=getInputTime('start_t');
				loopEnd=getInputTime('end_t');

				/* setting values in case any input is left empty */
				setInputTime('start_t',loopStart);
				setInputTime('end_t',loopEnd);

		        updateEndPoints(vDuration,loopStart,loopEnd);

		        browser.tabs.query({active: true, currentWindow: true})
			        .then(function(tabs){

			        	browser.tabs.sendMessage(tabs[0].id, {
				          command: "enable",
				          start: loopStart,
				          end: loopEnd
				        });

			        })
			        .catch(function(error){
			        	console.error(error);
			        });

			}

			var dragStart=false,selectedEndPoint=null;
			$(window).on('mousemove','',function(e){

				if($('#mask').hasClass('enabled'))
					return;

				if(e.pageY>$('#seeker').offset().top-10 && e.pageY<$('#seeker').offset().top+$('#seeker').height()+10){
					$('.end_points').addClass('hover');
				}else if(!$('.end_points').hasClass('clicked')){
					$('.end_points').removeClass('hover');
				}

				if(dragStart){
					if(selectedEndPoint=='start_p'){

						if(e.pageX<$('#end_p').offset().left){

							if(e.pageX>$('#seeker').offset().left){

								updateEndPoints(vDuration,Math.floor(
									((e.pageX-$('#seeker').offset().left)/$('#seeker').width())*vDuration
									),loopEnd);
							}else{
								updateEndPoints(vDuration,0,loopEnd);
							}
						}else{

							updateEndPoints(vDuration,loopEnd-(vDuration/$('#seeker').width())*10,loopEnd);
						}

					}else if(selectedEndPoint=='end_p'){
						
						if(e.pageX>$('#start_p').offset().left+$('#start_p').width()){

							if(e.pageX<$('#seeker').offset().left+$('#seeker').width()){
								updateEndPoints(vDuration,loopStart,Math.floor(
									((e.pageX-$('#seeker').offset().left)/$('#seeker').width())*vDuration
									));
							}else{
								updateEndPoints(vDuration,loopStart,vDuration);
							}
						}else{

							updateEndPoints(vDuration,loopStart,loopStart+(vDuration/$('#seeker').width())*10);
						}
					}
				}
			});
			$(window).on('mousedown','',function(e){

				if($('#mask').hasClass('enabled'))
					return;

				if(e.pageY>$('#seeker').offset().top-10 && e.pageY<$('#seeker').offset().top+$('#seeker').height()+10){
					if( e.pageX>(($('#start_p').offset().left+$('#end_p').offset().left)/2) ){
						$('#end_p').addClass('clicked');
						selectedEndPoint='end_p';
					}
					else{
						$('#start_p').addClass('clicked');
						selectedEndPoint='start_p';
						
					}
					dragStart=true;
					$('.times').removeClass('invalid');
					$('.arrows').removeClass('invalid');
					console_clear();
				}
			});
			$(window).on('mouseup','',function(){
				$('.end_points.clicked').removeClass('clicked');
				dragStart=false;
				okToEnable=true;
				sendEnableMessage();
			});

			/* preventing invalid char. to input in inputs */
			$('input').on('keypress','',function(e){
				if(!(e.which>='0'.charCodeAt(0) && e.which<='9'.charCodeAt(0) || e.which==8 || e.which==0))
					e.preventDefault();
			});

			$('input').on('input', '', function(e) {

				var currVal=0;
				if(e.target.classList.contains('start_t')){
					currVal=getInputTime('start_t');
					if(currVal>vDuration || currVal>=loopEnd){ /*-(vDuration/$('#seeker').width())*10 for resriction*/
						$('#start_t').addClass('invalid');
						$('#start_arrow').addClass('invalid');
						okToEnable=false;
						console_log('start time should be smaller than end time.');
					}
					else{
						$('#start_t').removeClass('invalid');
						$('#start_arrow').removeClass('invalid');
						console_clear();
						okToEnable=true;
					}

				}else if(e.target.classList.contains('end_t')){
					currVal=getInputTime('end_t');
					if(currVal>vDuration || currVal<=loopStart){ /*+(vDuration/$('#seeker').width())*10 for restriction*/
						$('#end_t').addClass('invalid');
						$('#end_arrow').addClass('invalid');
						okToEnable=false;
						console_log('end time should be greater than start time.');
					}else{
						$('#end_t').removeClass('invalid');
						$('#end_arrow').removeClass('invalid');
						console_clear();
						okToEnable=true;
					}
				}
				
				clearTimeout(lastEnableCall);
				lastEnableCall=setTimeout(sendEnableMessage,2000);
			});


			document.getElementById('toggle_sec').addEventListener('click', function(){

				if(document.getElementById('toggle_button').className == "disabled"){
					
					enableToggle();
					sendEnableMessage();

				}else{
					
					disableToggle();

					browser.tabs.query({active: true, currentWindow: true})
				        .then(function(tabs){

				        	browser.tabs.sendMessage(tabs[0].id, {
					          command: "disable"
					        });
				        })
				        .catch(function(error){
				        	console.error(error);
				        });
				}
			});
			
			/** to hide the editor while the site is loading **/
			document.getElementById('content').style.display = 'none';
			console_log("waiting for site to load");

			browser.runtime.onMessage.addListener(function(msg){

				if(msg.command == "info"){

					if(isNaN(msg.duration) || isNaN(msg.start) || isNaN(msg.end)){

						document.getElementById('content').style.display = 'none';
						rerunScript();

						return;
					}
					document.getElementById('content').style.display = 'block';
					console_clear();
					if(msg.isEnabled == false){

						disableToggle();

					}else if(msg.isEnabled == true){

						enableToggle();
					}
					
					vDuration = msg.duration;
					loopStart = msg.start;
					loopEnd = msg.end;

					/* setting up input */
					if(vDuration<3600){
						$('input.hours').hide();
						$('.colon.hours').hide();
					} /** else show **/
					else{
						$('input.hours').show();
						$('.colon.hours').show();
					}
					if(vDuration<60){
						$('input.minutes').hide();
						$('.colon.minutes').hide();
					}else{
						$('input.minutes').show();
						$('.colon.minutes').show();
					}
					setInputTime('start_t',loopStart);
					setInputTime('end_t',loopEnd);

					$('.times').removeClass('invalid');
					$('.arrows').removeClass('invalid');

					/* setting input time width */
					updateEndPoints(vDuration,loopStart,loopEnd);

				}else if(msg.command == "urlchanged"){
					
					rerunScript();
				}
			});

			function rerunScript(){

				browser.tabs.query({active: true, currentWindow: true})
			        .then(function(tabs){
			        	
			        	browser.tabs.sendMessage(tabs[0].id, {
				          command: "reset"
				        });
			        })
			        .catch(function(error){
			        	console.error(error);
			        });

				browser.tabs.query({active: true, currentWindow: true}).then(function(tabs){

					/** if not correct url **/
					if(tabs[0].url.indexOf(patternToFind)==-1){

						document.getElementById('content').style.display = 'none';
						console_log('not compatible with the url.');

					} /** if correct url **/
					else{
						injectScript();
					}
				});

			}
			function injectScript(){

				browser.tabs.executeScript({
			    	file: "cont_script.js"
			    }).then(function(){
			    	/* asking for info */
			    	browser.tabs.query({active: true, currentWindow: true})
				        .then(function(tabs){
				        	
				        	browser.tabs.sendMessage(tabs[0].id, {
					          command: "info"
					        });
				        })
				        .catch(function(error){
				        	console.error(error);
				        });
			    });
			}
			injectScript();

		}
	},function(reason){
		console.error('error');
	});

	
});
