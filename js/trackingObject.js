
class TrackingObject {
  constructor(cv, realR, minArea, opening, closing, rectSize, focal = 1) {
    this.cv = cv
    this.opening = opening || 8
    this.closing = closing || 8
    this.rectSize = rectSize || 50
    this.x = 0
    this.y = 0
    this.R = 0
    this.realR = realR
		this.minArea = minArea
		this.focal = focal
  }

  setHSVFilter = (lower, higher) => {
		this.lowerHsv = lower
		this.higherHsv = higher
	}
	

  calculateCoordinatesWithMoments(m)
	{
		let dM01 = m.m01;
		let dM10 = m.m10;
		let dArea = m.m00;

		// Check the min area
		if (dArea < this.minArea)
			return;

		// Calculate the centroid of the object
		this.x = dM10 / dArea;
		this.y = dM01 / dArea;

		// Calculate our object radious
		this.R = Math.sqrt((dArea / 255) / 3.14);

		// Calculate the distance between the Object and the camera
		this.distanceFromCamera = ((this.focal || 1) * this.realR) / this.R;
	}

	drawCircle(img, color = [255,0,0, 255])
	{
		if (this.x >= 0 && this.y >= 0)
		{
			cv.circle(img, new cv.Point(this.x, this.y), this.R, color, 2);
		}
	}

	drawLineBetweenObject(img, obj,color = [255, 255, 255, 255])
	{
		cv.line(img, new cv.Point(this.x, this.y), new cv.Point(obj.x, obj.y), color, 2);
	}

	calculateDistanceBetweenObjct(obj)
	{
		if (this.R != 0 && obj.R != 0)
		{
			let distanceBetweenPx = Math.sqrt(Math.pow((obj.x - this.x), 2) + Math.pow((obj.y - this.y), 2));
			let distanceBetweenCm = distanceBetweenPx * this.distanceFromCamera / (this.focal || 1);
			return {distanceBetweenCm, distanceBetweenPx};
		}
		return null;
	}

}