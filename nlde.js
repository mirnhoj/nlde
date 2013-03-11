var currentFrame = 0;

var composition = {
  "width": 1280,
  "height": 720,
  "frame_rate": 24,
  "duration": 0,
  "frames": [],
  "keyframes": [],
  "layers": []
};

var frameRate = composition.frame_rate;

console.log(frameRate);

function updateTimecode () {
  var frame = currentFrame % frameRate;
  var seconds = Math.floor(currentFrame / frameRate) % 60;
  var minutes = Math.floor(currentFrame / frameRate / 60);

  document.getElementById("timecode").innerHTML = "frame = " + currentFrame + ", timecode = " + ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2) + ":" + ("0" + frame).slice(-2);  
}

function updateInfobox (element) {
  console.log(element);
  $("#infobox-id").val(element.id);  
  $("#infobox-tag").val($("#" + element.id).prop("tagName"));  
  $("#infobox-text").val($("#" + element.id).text());  
  $("#infobox-left").val($("#" + element.id).css("left"));  
  $("#infobox-top").val($("#" + element.id).css("top"));  
  $("#infobox-width").val($("#" + element.id).css("width"));  
  $("#infobox-height").val($("#" + element.id).css("height"));  
  $("#infobox-opacity").val($("#" + element.id).css("opacity"));  
  $("#infobox-font-size").val($("#" + element.id).css("font-size"));  
}

function updateFrame () {
  for (var layer = 0; layer < composition.frames.length; layer++) {
    var currentLayer = document.getElementById(composition.frames[layer].id);
    
    if (currentLayer === null) {
      currentLayer = document.createElement(composition.frames[layer].tag);
      currentLayer.setAttribute("id", composition.frames[layer].id);
      currentLayer.setAttribute("contenteditable", "true");
      document.getElementById("player").appendChild(currentLayer);
    }
    
    currentLayer = $("#" + composition.frames[layer].id);
    currentLayer.html(composition.frames[layer].html);
    currentLayer.css(composition.frames[layer].css);
    currentLayer.draggable({
      snap: true, 
      containment: "parent",
      drag: function (event, ui) {
        composition.frames[this.style.zIndex - 1].css.left = ui.position.left;
        composition.frames[this.style.zIndex - 1].css.top = ui.position.top;
        console.log(ui);
        updateInfobox(this);
      }
    });
    currentLayer.resizable().resizable("destroy").resizable({
      autoHide: true,
      resize: function (event, ui) {
        composition.frames[this.style.zIndex - 1].css.width = ui.size.width;
        composition.frames[this.style.zIndex - 1].css.height = ui.size.height;
        updateInfobox(this);
      }
    });
    currentLayer.bind('click', function(){$(this).focus()});
    currentLayer.bind('input', function(){
      composition.frames[this.style.zIndex - 1].html = this.textContent;
    });
    
    /*
    document.getElementById(composition.frames[layer].id).addEventListener("input", function() {
      composition.frames[this.style.zIndex - 1].html = this.textContent;
    }, false);
    
    */
  }
  
  
}

window.onload = function () {

var fontSizeForIdealLineLength = function (width) {
  var testSpan = document.createElement("span");
  testSpan.setAttribute("id", "test-span");
  testSpan.innerHTML = "Quick hijinx swiftly revamped gazebo. Quick hijinx swiftly revamped gazebo.";
  document.body.appendChild(testSpan);
  for (var fontSize = 0; fontSize <= Math.floor(width); fontSize++) {
    $("#test-span").css("font-size", fontSize);
    if ($("#test-span").outerWidth() > width) {
      document.body.removeChild(testSpan);
      return fontSize;
    }
  }
};

console.log(fontSizeForIdealLineLength(1024));

$("#player-title-safe").draggable();
$("#player-action-safe").draggable();
$("#infobox").draggable().resizable();
}



$(window).keydown(function (event) {
  var keycode = event.which;

  if (keycode === 33) {
    if (currentFrame > 0) {
      currentFrame -= 1;
    }
  
    updateTimecode();
    updateFrame();
  
  }
  
  if (keycode === 34) {
    currentFrame += 1;
  
  
    updateTimecode();
    updateFrame();
  }
  
  if (keycode === 121) {
    var layerNumber = composition.frames.length;
    
    composition.frames[layerNumber] = {
      "id": "layer" + layerNumber,
      "tag": "span",
      "html": "layer " + layerNumber,
      "css": {
        "position": "absolute",
        "left": "50px",
        "top": "50px",
        "font-size": "27px",
        "z-index": layerNumber + 1
      }
    }
    event.preventDefault(); 
    event.stopPropagation();
  
    updateTimecode();
    updateFrame();
  
  }
  
  
});

