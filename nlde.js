// the toTimeString method of a Date object does not give milliseconds, so we
// will extend the Date object to have a method which does. based on the shim
// shown at https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date/toISOString.
if (!Date.prototype.toFullTimeString) {
  (function () {
    function pad(number) {
      var r = String(number);
      if (r.length === 1) {
        r = '0' + r;
      }
      return r;
    }

    Date.prototype.toFullTimeString = function () {
      return pad(this.getHours())
        + ':' + pad(this.getMinutes())
        + ':' + pad(this.getSeconds())
        + ':' + String((this.getMilliseconds() / 1000).toFixed(3)).slice(2, 5);
    };
  }());
}

/**
 * A composition.
 * @constructor
 * @param {number} width The width of the composition.
 * @param {number} height The height of the composition.
 * @param {number} frameRate The frame rate of the composition.
 */
function Composition(width, height, frameRate) {
  this.width = width;
  this.height = height;
  this.frameRate = frameRate;

  // use builtin Date object to store duration for useful time methods.
  this.duration = new Date(0, 0, 0, 0, 0, 0, 0);

  this.keyFrames = {};
  this.layers = [];

  /**
   * Adds or updates a key frame in this composition.
   * @param {string} layerID The layer to attach this key frame.
   * @param {Date} time The time in the composition to attach this key frame.
   * @param {string} key The key of the css key/value pair.
   * @param {string} value The value of the css key/value pair.
   */
  this.setKeyFrame = function (layerID, time, key, value) {
    // form that json that will be merged with the general composition json.
    var jsonString = ''
      + '{'
      + '"' + time.getTime() + '"' + ': ' + '{'
      + '"' + 'css' + '"' + ': ' + '{'
      + '"' + key + '"' + ': ' + '"' + value + '"'
      + '}'
      + '}'
      + '}';

    // merge the jsonString into the general composition json.
    this.keyFrames[layerID] = $.extend(
      true,
      this.keyFrames[layerID],
      JSON.parse(jsonString)
    );

    // extend duration of composition if this key frame is after duration.
    if (time.getTime() > this.duration.getTime()) {
      this.duration = new Date(time.getTime());
    }

    // update
    drawFrame(currentTime);
    updatePanelLayerInfo();
  };

  /**
   * Removes a key frame from this composition if it exists.
   * @param {string} layerID The layer that applies to the key frame.
   * @param {Date} time The time in the composition of the key frame.
   * @param {string} key The key of the css key/value pair.
   */
  this.removeKeyFrame = function (layerID, time, key) {
    // try to delete key frame. if it doesn't exist, do nothing.
    try {
      delete this.keyFrames[layerID][time.getTime()]["css"][key];
    } catch (error) {
      console.warn(error);
    }

    //update
    drawFrame(currentTime);
    updatePanelLayerInfo();
  };

  /**
   * Gets the time of the last relevant key frame.
   * @param {string} layerID The layer of the key frame.
   * @param {Date} time The current time in the composition.
   * @param {string} key The key of the css key/value pair.
   * @return {number} The getTime() results of the last key frame.
   */
  this.getPrevKeyFrame = function (layerID, time, key) {
    var desiredKeyFrameTime = null;
    var currentKeyFrameTime = null;

    // loop through all key frames for the relavant layer
    for (var keyFrame in this.keyFrames[layerID]) {
      if (this.keyFrames[layerID].hasOwnProperty(keyFrame)) {
        // skip this iteration if this key frame doesn't have the relevant key.
        if (!this.keyFrames[layerID][keyFrame]["css"][key]) {
          continue;
        }

        currentKeyFrameTime = new Date(parseInt(keyFrame, 10));

        // if a potential key frame has not been found and this key frame is
        // before the relevant time, then set desiredKeyFrame.
        if (desiredKeyFrameTime === null
          && currentKeyFrameTime.getTime() <= time.getTime()) {
          desiredKeyFrameTime = new Date(parseInt(keyFrame, 10));
          continue;
        }

        // if this key frame is before the relevant time and after the current
        // desiredKeyFrame, the set desired to this.
        if (currentKeyFrameTime.getTime() <= time.getTime()
          && currentKeyFrameTime.getTime() > desiredKeyFrameTime.getTime()) {
          desiredKeyFrameTime = new Date(parseInt(keyFrame, 10));
        }
      }
    }

    // if a potential key frame was found and set, return the time.
    if (desiredKeyFrameTime) {
      return desiredKeyFrameTime.getTime();
    }
  };

  /**
   * Gets the time of the next relevant key frame.
   * @param {string} layerID The layer of the key frame.
   * @param {Date} time The current time in the composition.
   * @param {string} key The key of the css key/value pair.
   * @return {number} The getTime() results of the next key frame.
   */
  this.getNextKeyFrame = function (layerID, time, key) {
    var desiredKeyFrameTime = null;
    var currentKeyFrameTime = null;

    // loop through all key frames for the relavant layer
    for (var keyFrame in this.keyFrames[layerID]) {
      if (this.keyFrames[layerID].hasOwnProperty(keyFrame)) {
        // skip this iteration if this key frame doesn't have the relevant key.
        if (!this.keyFrames[layerID][keyFrame]["css"][key]) {
          continue;
        }

        currentKeyFrameTime = new Date(parseInt(keyFrame, 10));

        // if a potential key frame has not been found and this key frame is
        // after the relevant time, then set desiredKeyFrame.
        if (desiredKeyFrameTime === null
          && currentKeyFrameTime.getTime() >= time.getTime()) {
          desiredKeyFrameTime = new Date(parseInt(keyFrame, 10));
          continue;
        }

        // if this key frame is after the relevant time and before the current
        // desiredKeyFrame, the set desired to this.
        if (currentKeyFrameTime.getTime() >= time.getTime()
          && currentKeyFrameTime.getTime() < desiredKeyFrameTime.getTime()) {
          desiredKeyFrameTime = new Date(parseInt(keyFrame, 10));
        }
      }
    }

    // if a potential key frame was found and set, return the time.
    if (desiredKeyFrameTime) {
      return desiredKeyFrameTime.getTime();
    }
  };

  /**
   * Outputs this composition to json.
   * @return {string} The json representation of the composition.
   */
  this.toJSON = function () {
    // create json that represents the composition.
    var json = {
      "width": this.width,
      "height": this.height,
      "frameRate": this.frameRate,
      "duration": this.duration,
      "keyFrames": this.keyFrames,
      "layers": this.layers
    };

    // return stringified json.
    return JSON.stringify(json);
  };

  /**
   * Alters this composition based on json.
   */
  this.fromJSON = function (json) {
    // try to set this composition from json input. if it doesn't, do nothing.
    try {
      // set composition params.
      this.width = json.width;
      this.height = json.height;
      this.frameRate = json.frameRate;
      this.duration = new Date(json.duration);
      this.keyFrames = json.keyFrames;
      this.layers = json.layers;

      // set the current layer to first layer.
      currentLayer = 0;
    } catch (error) {
      console.warn(error);
    }
  };
}


// create new composition.
var newComp = new Composition(1280, 720, 30);

// set current frame, layer, and time.
var currentFrame = 0;
var currentLayer = -1;
var currentTime = new Date(0, 0, 0, 0, 0, 0, 0);

// set the tweenable css keys.
var tweenableValues = [
  "top",
  "left",
  "width",
  "height",
  "font-size",
  "opacity"
];


/**
 * Updates timecode panel and composition json panel based on current frame.
 */
function updateTimecode () {
  // grab granular elements of the timecode.
  var milliseconds = Math.floor(
    currentFrame % newComp.frameRate * 1000 / newComp.frameRate
  );
  var seconds = Math.floor(currentFrame / newComp.frameRate % 60);
  var minutes = Math.floor(currentFrame / newComp.frameRate / 60);
  var hours = Math.floor(currentFrame / newComp.frameRate / 60 / 60);

  // set current time to Date object based on the previously calculated values.
  currentTime = new Date(0, 0, 0, hours, minutes, seconds, milliseconds);

  // update timecode panel.
  document.getElementById("timecode").innerHTML = ""
    + "frame = " + currentFrame + ", "
    + "timecode = " + currentTime.toFullTimeString();

  // update composition json panel.
  document.getElementById("composition-json").value =
    newComp.toJSON();
}

/**
 * Updates the layer info panel.
 */
function updatePanelLayerInfo () {
  // if no layers exist, then don't update.
  if (currentLayer !== -1) {
    // show general properties.
    $("#layer-id").val("layer" + currentLayer);
    $("#layer-tag").val($("#" + "layer" + currentLayer).prop("tagName"));
    $("#layer-text").val($("#" + "layer" + currentLayer).text());

    // loop through the properties that are tweenable.
    for (var i = 0; i < tweenableValues.length; i++) {
      // show tweenable property.
      $("#layer-" + tweenableValues[i]).val(
        $("#layer" + currentLayer).css(tweenableValues[i])
      );

      // set background color to yellow if it's a key frame.
      var isKeyFrame = false;
      try {
        isKeyFrame = newComp.keyFrames["layer" + currentLayer][currentTime.getTime()]["css"][tweenableValues[i]];
      } catch (error) {
        isKeyFrame = false;
      }
      if (isKeyFrame) {
        $("#layer-" + tweenableValues[i]).css("background-color", "yellow");
      } else {
        $("#layer-" + tweenableValues[i]).css("background-color", "white");
      }
    }
  }
}

/**
 * Returns the tweened value based on Robert Penner's easing equations (http://www.robertpenner.com/easing/).
 * @param {number} t current time.
 * @param {number} b beginning value.
 * @param {number} c change in value.
 * @param {number} d duration.
 * @param {string} prevKeyFrameType type of previous key frame.
 * @param {string} nextKeyFrameType type of next key frame.
 * @return {number} calculated tween value.
 */
function tween(t, b, c, d, prevKeyFrameType, nextKeyFrameType) {
  if (prevKeyFrameType === "linear" && nextKeyFrameType === "linear") {
    return c * t / d + b;
  }

  if (prevKeyFrameType === "circular" && nextKeyFrameType === "circular") {
    t /= d/2;
    if (t < 1) {
      return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
    }

    t -= 2;
    return c/2 * (Math.sqrt(1 - t*t) + 1) + b;
  }
}


/**
 * Draws the frame for the given time.
 * @param {number} time time of frame to draw.
 */
function drawFrame(time) {
  // go through each layer of the composition.
  for (var i = 0; i < newComp.layers.length; i++) {

    // grab current layer element or create if it doesn't exist.
    var curLayer = document.getElementById(newComp.layers[i].id);
    if (curLayer === null) {
      curLayer = document.createElement(newComp.layers[i].tag);
      curLayer.setAttribute("id", newComp.layers[i].id);
      curLayer.setAttribute("contenteditable", "true");
      document.getElementById("player").appendChild(curLayer);
    }
    curLayer = $("#" + newComp.layers[i].id);

    // set the html of the current layer.
    curLayer.html(newComp.layers[i].html);

    // create an object to hold the css properties for this layer.
    var currentLayerCSS = {};

    // grab position from initial key frame.
    currentLayerCSS["position"] =
      newComp.keyFrames[newComp.layers[i].id]["-2209050000000"]["css"]["position"];

    // grab z-index from initial key frame.
    currentLayerCSS["z-index"] =
      newComp.keyFrames[newComp.layers[i].id]["-2209050000000"]["css"]["z-index"];

    // loop through tweenable css properties
    for (var j = 0; j < tweenableValues.length; j++) {
      // get time of previous relevant key frame.
      var previousKeyFrameTime =
        newComp.getPrevKeyFrame(newComp.layers[i].id, time, tweenableValues[j]);

      // get time of next relevant key frame.
      var nextKeyFrameTime =
        newComp.getNextKeyFrame(newComp.layers[i].id, time, tweenableValues[j]);

      // if only a previous key frame exists, set css properties from that.
      if (previousKeyFrameTime && !nextKeyFrameTime) {
        currentLayerCSS[tweenableValues[j]] =
          newComp.keyFrames[newComp.layers[i].id][previousKeyFrameTime]["css"][tweenableValues[j]];
      }

      // if only a next key frame exists, set css properties from that.
      if (!previousKeyFrameTime && nextKeyFrameTime) {
        currentLayerCSS[tweenableValues[j]] =
          newComp.keyFrames[newComp.layers[i].id][nextKeyFrameTime]["css"][tweenableValues[j]];
      }

      // if currently on a key frame, set css properties from that.
      if (previousKeyFrameTime === time.getTime() || nextKeyFrameTime === time.getTime()) {
        currentLayerCSS[tweenableValues[j]] =
          newComp.keyFrames[newComp.layers[i].id][nextKeyFrameTime]["css"][tweenableValues[j]];
      }

      // if both key frames exist, set css properties to tweened values.
      if (previousKeyFrameTime && nextKeyFrameTime && previousKeyFrameTime !== time.getTime()) {
        // grab relevant info for the tweening function.
        var t = time.getTime() - previousKeyFrameTime;
        var b =
          parseFloat(newComp.keyFrames[newComp.layers[i].id][previousKeyFrameTime]["css"][tweenableValues[j]]);
        var endValue =
          parseFloat(newComp.keyFrames[newComp.layers[i].id][nextKeyFrameTime]["css"][tweenableValues[j]]);
        var c = endValue - b;
        var d = nextKeyFrameTime - previousKeyFrameTime;

        currentLayerCSS[tweenableValues[j]] = tween(t, b, c, d, "circular", "circular");
      }
    }

    // set the current layer's css
    curLayer.css(currentLayerCSS);

    // make layer draggable and update key frame if dragged.
    curLayer.draggable({
      snap: true,
      containment: "parent",
      drag: function (event, ui) {
        currentLayer = parseInt(this.id.replace("layer", ""), 10);

        newComp.setKeyFrame(
          this.id,
          currentTime,
          "left", ui.position.left);

        newComp.setKeyFrame(
          this.id,
          currentTime,
          "top", ui.position.top);

        updatePanelLayerInfo();
      }
    });

    // make layer resizable and update key frame if resized.
    curLayer.resizable().resizable("destroy").resizable({
      autoHide: true,
      resize: function (event, ui) {
        currentLayer = parseInt(this.id.replace("layer", ""), 10);

        newComp.setKeyFrame(
          this.id,
          currentTime,
          "width", ui.size.width);

        newComp.setKeyFrame(
          this.id,
          currentTime,
          "height", ui.size.height);

        updatePanelLayerInfo();
      }
    });

    // toggle focus on click.
    curLayer.bind('click', function () {
      currentLayer = parseInt(this.id.replace("layer", ""), 10);

      if ($("#layer" + currentLayer).is(":focus")) {
        $(this).blur();
      } else {
        $(this).focus();
      }

      updatePanelLayerInfo();
    });

    // update layer when input is changed.
    curLayer.bind('input', function () {
      currentLayer = parseInt(this.id.replace("layer", ""), 10);

      newComp.layers[parseInt(this.id.replace("layer",""), 10)].html =
        this.textContent;

      updatePanelLayerInfo();
    });
  }
}


/**
 * Calls for next frame of the animation.
 */
function animate() {
  // loop back to the beginning if end is reached.
  if (currentTime.getTime() >= newComp.duration.getTime()) {
    currentFrame = 0;
  } else {
    currentFrame++;
  }

  updateTimecode();
  drawFrame(currentTime);
  updatePanelLayerInfo();
}

/**
 * Event handler for when the page is done loading.
 */
$(window).load(function () {
  // make title and action-safe draggable so other elements will snap to them.
  $("#player-title-safe").draggable();
  $("#player-action-safe").draggable();

  // make the layer info panel draggable and resizable.
  $("#panel-layer-info").draggable().resizable();

  // create event handlers for the tweenable properties.
  for (var i = 0; i < tweenableValues.length; i++) {
    // set key frame if value is changed.
    $("#layer-" + tweenableValues[i]).bind('input', function () {
      newComp.setKeyFrame (
        "layer" + currentLayer,
        currentTime,
        this.id.replace("layer-", ""), this.value
      );

      //update
      updateTimecode();
      drawFrame(currentTime);
      updatePanelLayerInfo();
    });

    // remove key frame if double-clicked.
    $("#layer-" + tweenableValues[i]).dblclick(function () {
      newComp.removeKeyFrame (
        "layer" + currentLayer,
        currentTime,
        this.id.replace("layer-", "")
      );

      //update
      updateTimecode();
      drawFrame(currentTime);
      updatePanelLayerInfo();
    });
  }

  // update composition if json is input.
  $("#composition-json").bind('input', function () {
    newComp.fromJSON(JSON.parse(this.value));
    updateTimecode();
    drawFrame(currentTime);
    updatePanelLayerInfo();
  });

  $("#composition-json").draggable().resizable();
});


var isAnimating = false;
var animationInterval = null;


/**
 * Event handler for when a key is pressed.
 */
$(window).keydown(function (event) {
  var keycode = event.which;

  // decrement current frame when "PgUp" is pressed.
  if (keycode === 33) {
    if (currentFrame > 0) {
      currentFrame -= 1;
    }

    updateTimecode();
    drawFrame(currentTime);
    updatePanelLayerInfo();
  }

  // increment current frame when "PgDn" is pressed.
  if (keycode === 34) {
    currentFrame += 1;

    updateTimecode();
    drawFrame(currentTime);
    updatePanelLayerInfo();
  }

  // add new span layer when "f10" is pressed.
  if (keycode === 121) {
    var layerNumber = newComp.layers.length;

    currentLayer = layerNumber;

    newComp.layers[layerNumber] = {
      "id": "layer" + layerNumber,
      "tag": "span",
      "html": "layer " + layerNumber
    };

    newComp.setKeyFrame (
      newComp.layers[layerNumber].id,
      new Date(0, 0, 0, 0, 0, 0, 0),
      "position", "absolute");

    newComp.setKeyFrame (
      newComp.layers[layerNumber].id,
      new Date(0, 0, 0, 0, 0, 0, 0),
      "left", "100px");

    newComp.setKeyFrame (
      newComp.layers[layerNumber].id,
      new Date(0, 0, 0, 0, 0, 0, 0),
      "top", "100px");

    newComp.setKeyFrame (
      newComp.layers[layerNumber].id,
      new Date(0, 0, 0, 0, 0, 0, 0),
      "font-size", "27px");

    newComp.setKeyFrame (
      newComp.layers[layerNumber].id,
      new Date(0, 0, 0, 0, 0, 0, 0),
      "opacity", 1);

    newComp.setKeyFrame (
      newComp.layers[layerNumber].id,
      new Date(0, 0, 0, 0, 0, 0, 0),
      "z-index", layerNumber + 1);

    event.preventDefault();
    event.stopPropagation();

    updateTimecode();
    drawFrame(currentTime);
    updatePanelLayerInfo();
  }
  
  // toggle animation when space is pressed.
  if (keycode === 32) {
    if (isAnimating) {
      clearInterval(animationInterval);
      isAnimating = false;
    } else {
      animationInterval = setInterval(animate, 1000 / newComp.frameRate);
      isAnimating = true;
    }
  }
});
