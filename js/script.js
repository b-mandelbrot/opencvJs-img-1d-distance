document.body.classList.add("loading");

const FPS = 30;

let src
let dst
let cap
let initialObj
let finalObj

function processVideo() {
  try {
    let begin = Date.now();
    
    // start processing.
    cap.read(src);
    
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
      document.getElementById('results').innerHTML =`The distance is ${distance.distanceBetweenCm.toFixed(2)} cm!`

    cv.imshow('imageCanvas', src)

    lowInitial.delete()
    highInitial.delete()
    lowFinal.delete()
    highFinal.delete()
    iThresholded.delete()
    fThresholded.delete()
    
    // schedule the next one.
    let delay = 1000 / FPS - (Date.now() - begin);
    setTimeout(processVideo, delay);
  } catch (err) {
    console.log(err)
  }
};


document.getElementById('hsvSliders').addEventListener('change', (e) => {
  initialObj.setHSVFilter([parseFloat(document.getElementById('initialLowH').value), parseFloat(document.getElementById('initialLowS').value), parseFloat(document.getElementById('initialLowV').value), 0], [parseFloat(document.getElementById('initialHighH').value), parseFloat(document.getElementById('initialHighS').value),parseFloat(document.getElementById('initialHighV').value), 255]);
  finalObj.setHSVFilter([parseFloat(document.getElementById('finalLowH').value), parseFloat(document.getElementById('finalLowS').value), parseFloat(document.getElementById('finalLowV').value), 0], [parseFloat(document.getElementById('finalHighH').value), parseFloat(document.getElementById('finalHighS').value), parseFloat(document.getElementById('finalHighV').value), 255]);
})

document.getElementById('realR').addEventListener('change', (e) => {
  initialObj.setRealR(e.target.value)
  finalObj.setRealR(e.target.value)
})

window.onresize = () => {
  let video = document.getElementById('videoInput')
  src.delete()
  dst.delete()
  let videoContainer = document.getElementById('videoContainer')
  video.width = parseInt(videoContainer.clientWidth) <= 800 ? videoContainer.clientWidth : '800'
  video.height = `${parseInt(video.width) * 0.75}`
  src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
}

function onOpenCvReady() {
  let video = document.getElementById('videoInput')
  let videoContainer = document.getElementById('videoContainer')
  video.width = parseInt(videoContainer.clientWidth) <= 800 ? videoContainer.clientWidth : '800'
  video.height = `${parseInt(video.width) * 0.75}`

  video.addEventListener('play', () => {
    let video = document.getElementById('videoInput')
    src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    cap = new cv.VideoCapture(video);
    setTimeout(processVideo, 0);
  })
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(function (stream) {
      video.srcObject = stream;
      video.play();
    })
    .catch(function (err) {
      console.log("An error occurred! " + err);
    });
  
    let realR = document.getElementById('realR').value

  initialObj = new TrackingObject(cv, realR, 1000)
  finalObj = new TrackingObject(cv, realR, 1000)
  
  initialObj.setHSVFilter([parseFloat(document.getElementById('initialLowH').value), parseFloat(document.getElementById('initialLowS').value), parseFloat(document.getElementById('initialLowV').value), 0], [parseFloat(document.getElementById('initialHighH').value), parseFloat(document.getElementById('initialHighS').value),parseFloat(document.getElementById('initialHighV').value), 255]);
  finalObj.setHSVFilter([parseFloat(document.getElementById('finalLowH').value), parseFloat(document.getElementById('finalLowS').value), parseFloat(document.getElementById('finalLowV').value), 0], [parseFloat(document.getElementById('finalHighH').value), parseFloat(document.getElementById('finalHighS').value), parseFloat(document.getElementById('finalHighV').value), 255]);

  document.body.classList.remove("loading");
  document.body.classList.remove("hidden");
}

window.onclose = () => {
  src.delete()
  dst.delete()
}
