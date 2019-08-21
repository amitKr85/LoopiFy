(function(){

	/**
	* Check and set a global guard variable.
	* If this content script is injected into the same page again,
	* it will do nothing next time.
	*/
	if(window.hasScriptRun){
		return;
	}
	/* setting up variables	*/
	window.hasScriptRun = true;
	window.isExtentionEnabled = false;
	var videoEl = document.getElementsByTagName('video')[0];
	window.videoDuration = Math.trunc(videoEl.duration);
	window.loopStart = 0;
	window.loopEnd = videoDuration;

	function setLoopOne(){

		if(this.currentTime>window.loopEnd-0.1 || this.currentTime<window.loopStart){
			this.currentTime=window.loopStart;
			this.play();
		}
	}

	browser.runtime.onMessage.addListener(messageListener);

	function messageListener(msg){
		if(msg.command == "enable"){

			/* safety measure */
			if(msg.start>=msg.end){
				browser.runtime.sendMessage({
					command: "info",
					isEnabled: window.isExtentionEnabled,
					duration: window.videoDuration,
					start: window.loopStart,
					end: window.loopEnd 
				});
				return;
			}
			window.isExtentionEnabled = true;
			window.loopStart = msg.start;
			window.loopEnd = msg.end;

			/** enable script **/
			videoEl.removeEventListener('timeupdate', setLoopOne);
			videoEl.addEventListener('timeupdate', setLoopOne);

			/** if video is finished and extention enabled by user **/
			setLoopOne.call(videoEl);

		}else if(msg.command == "info"){
			
			browser.runtime.sendMessage({
				command: "info",
				isEnabled: window.isExtentionEnabled,
				duration: window.videoDuration,
				start: window.loopStart,
				end: window.loopEnd 
			});
		}else if(msg.command == "disable"){

			window.isExtentionEnabled = false;
			/** disable script **/
			videoEl.removeEventListener('timeupdate', setLoopOne);

		}else if(msg.command == "reset"){

			browser.runtime.onMessage.removeListener(messageListener);
			videoEl.removeEventListener('timeupdate', setLoopOne);
			window.hasScriptRun=false;
			window.loopEnd=0;

		}
	}


	var prevUrl=window.location.href;
	var prevSrc=videoEl.src;

	function checkForURL(){
		if(window.location.href!=prevUrl || videoEl.src!=prevSrc){
			onURLChanged();
		}else{
			setTimeout(checkForURL,500);
		}
	}
	checkForURL();
	function onURLChanged(){


		browser.runtime.onMessage.removeListener(messageListener);
		videoEl.removeEventListener('timeupdate', setLoopOne);
		window.hasScriptRun=false;
		window.loopEnd=0;

		browser.runtime.sendMessage({
			command: "urlchanged"
		});

	}

})();
