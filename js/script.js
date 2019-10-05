document.body.classList.add("loading");

let initialObj
let finalObj

document.getElementById('hsvSliders').addEventListener('change', (e) => {
  initialObj.setHSVFilter([parseFloat(document.getElementById('initialLowH').value), parseFloat(document.getElementById('initialLowS').value), parseFloat(document.getElementById('initialLowV').value), 0], [parseFloat(document.getElementById('initialHighH').value), parseFloat(document.getElementById('initialHighS').value),parseFloat(document.getElementById('initialHighV').value), 255]);
  finalObj.setHSVFilter([parseFloat(document.getElementById('finalLowH').value), parseFloat(document.getElementById('finalLowS').value), parseFloat(document.getElementById('finalLowV').value), 0], [parseFloat(document.getElementById('finalHighH').value), parseFloat(document.getElementById('finalHighS').value), parseFloat(document.getElementById('finalHighV').value), 255]);
  processImage()
})

document.getElementById('realR').addEventListener('change', (e) => {
  initialObj.setRealR(e.target.value)
  finalObj.setRealR(e.target.value)
  processImage()
})

let imgElement = document.getElementById('imageOriginal');
let inputElement = document.getElementById('imageInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);

imgElement.onload = function() {
  let src
  src = cv.imread(imgElement);
  cv.imshow('imageCanvas', src);
  src.delete()
  processImage()
};

function processImage() {
  try {
    // start processing.
    this.disabled = true;
    let src = cv.imread(imgElement);
    let dst = src.clone()
    
    cv.cvtColor(src, dst, cv.COLOR_BGR2HSV, 0)
    
    // Here we choose the interval to get the objects by their HSV color, see the hsvMap to get your desired values!

    let iThresholded, fThresholded
    
    iThresholded = new cv.Mat()
    fThresholded = new cv.Mat()

    let lowInitial = new cv.Mat(dst.rows, dst.cols, dst.type(), initialObj.lowerHsv);
    let highInitial = new cv.Mat(dst.rows, dst.cols, dst.type(), initialObj.higherHsv);

    let lowFinal = new cv.Mat(dst.rows, dst.cols, dst.type(), finalObj.lowerHsv);
    let highFinal = new cv.Mat(dst.rows, dst.cols, dst.type(), finalObj.higherHsv);

    cv.inRange(dst, lowFinal, highFinal, fThresholded);
    cv.inRange(dst, lowInitial, highInitial, iThresholded);

    if (initialObj.opening > 0)
		{
		  let M = cv.Mat.ones(initialObj.opening, initialObj.opening, cv.CV_8U);
      let anchor = new cv.Point(-1, -1);
      cv.erode(iThresholded, iThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      cv.dilate(iThresholded, iThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      M.delete();
		}
		if (initialObj.closing > 0)
		{
      let M = cv.Mat.ones(initialObj.closing, initialObj.closing, cv.CV_8U);
      let anchor = new cv.Point(-1, -1);
      cv.dilate(iThresholded, iThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      cv.erode(iThresholded, iThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      M.delete();
		}

		if (finalObj.opening > 0)
		{
      let M = cv.Mat.ones(finalObj.opening, finalObj.opening, cv.CV_8U);
      let anchor = new cv.Point(-1, -1);
      cv.erode(fThresholded, fThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      cv.dilate(fThresholded, fThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      M.delete();
		}
		if (finalObj.closing > 0)
		{
      let M = cv.Mat.ones(finalObj.closing, finalObj.closing, cv.CV_8U);
      let anchor = new cv.Point(-1, -1);
      cv.dilate(fThresholded, fThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      cv.erode(fThresholded, fThresholded, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
      M.delete();
		}  
    
    // Calculate the Moments of the Thresholdeds Images
		let iMoments = cv.moments(iThresholded)
		let fMoments = cv.moments(fThresholded)

		// Calculate what we need with the moments
		initialObj.calculateCoordinatesWithMoments(iMoments);
		finalObj.calculateCoordinatesWithMoments(fMoments);

		// Draw the two circles
		initialObj.drawCircle(src);
		finalObj.drawCircle(src);

		// Draw a line between the objects
		initialObj.drawLineBetweenObject(src, finalObj);

    const distance = initialObj.calculateDistanceBetweenObjct(finalObj)

    if (distance)
      document.getElementById('results').innerHTML =`px: ${distance.distanceBetweenPx}\ncm: ${distance.distanceBetweenCm}`

    cv.imshow('imageCanvas', src)

    // document.getElementById('button').disabled = false

    lowInitial.delete()
    highInitial.delete()
    lowFinal.delete()
    highFinal.delete()
    iThresholded.delete()
    fThresholded.delete()
    src.delete()
    dst.delete();
  } catch (err) {
    console.log(err)
  }
};


/*document.getElementById('button').onclick = function() {
  this.href = document.getElementById("imageCanvas").toDataURL();
  this.download = "image.png";
};*/

function onOpenCvReady() {
  
  let realR = document.getElementById('realR').value

  initialObj = new TrackingObject(cv, realR, 1000)
  finalObj = new TrackingObject(cv, realR, 1000)
  
  initialObj.setHSVFilter([parseFloat(document.getElementById('initialLowH').value), parseFloat(document.getElementById('initialLowS').value), parseFloat(document.getElementById('initialLowV').value), 0], [parseFloat(document.getElementById('initialHighH').value), parseFloat(document.getElementById('initialHighS').value),parseFloat(document.getElementById('initialHighV').value), 255]);
  finalObj.setHSVFilter([parseFloat(document.getElementById('finalLowH').value), parseFloat(document.getElementById('finalLowS').value), parseFloat(document.getElementById('finalLowV').value), 0], [parseFloat(document.getElementById('finalHighH').value), parseFloat(document.getElementById('finalHighS').value), parseFloat(document.getElementById('finalHighV').value), 255]);
  
  document.body.classList.remove("loading");
  document.body.classList.remove("hidden");
}