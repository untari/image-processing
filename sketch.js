// Declare variables for video, pictures, channels, and segmented images
let video;
let picture;
let scaledPicture;
let greyPicture;
let redChannel, greenChannel, blueChannel;
let segmentedImages = {
  rgb: null,
  hsv: null,
  ycbcr: null
};

// Declare threshold values for segmentation
let redThreshold, greenThreshold, blueThreshold;

// Declare images for HSV and YCbCr color spaces
let hsvImage;
let ycbcrImage;
let segmentedHsvImage;

// Initialize faceapi and face detection results
let faceapi;
let detections;

// Track the current face modification and capture status
let currentFaceModification = 'original';
let hasTakenPicture = false;
let hasapplyEffectToFace = false;

// Declare an image for output modifications
let outimage;

// Define face detection options
const detectionOptions = {
  withLandmarks: true,
  withDescriptors: false,
};

// Setup function for initializing the canvas, video, and faceapi
function setup() {
  createCanvas(840 * 2, 680);
  video = createCapture(VIDEO);
  video.hide();

  faceapi = ml5.faceApi(detectionOptions, modelReady);

  const captureButton = createButton('Capture Image');
  captureButton.position(0, 100)
  captureButton.id('captureButton');
  captureButton.mousePressed(takePicture);

  redThreshold = createSlider(0, 255, 128);
  redThreshold.position(0, 230 + 120 + 40); // Adjusted position

  greenThreshold = createSlider(0, 255, 128);
  greenThreshold.position(200, 230 + 120 + 40); // Adjusted position

  blueThreshold = createSlider(0, 255, 128);
  blueThreshold.position(400, 230 + 120 + 40); // Adjusted position

  // thresholdSlider = createSlider(0, 255, staticThreshold);
  // thresholdSlider.position(550, 700, 130);
}

// Handle key presses to change face modification effect
function keyTyped() {
  switch (key) {
    case '1':
      currentFaceModification = 'greyscale';
      break;
    case '2':
      currentFaceModification = 'blurred';
      break;
    case '3':
      currentFaceModification = 'colorConverted';
      break;
    case '4':
      currentFaceModification = 'pixelate';
      break;
  }
}

// Main drawing function
function draw() {
  background(255);

  // Display the webcam image
  image(video, 0, 0, 160, 120);

  if (picture) {
    // Display the greyscale version
    image(greyPicture, 200, 0, 160, 120);

    // Perform segmentation with individual channel thresholds
    let segmentedImages = segmentImageSliders(scaledPicture, redThreshold.value(), greenThreshold.value(), blueThreshold.value());

    // Display the R, G, B channels with threshold control
    image(redChannel, 0, 140, 160, 120);
    image(greenChannel, 200, 140, 160, 120);
    image(blueChannel, 400, 140, 160, 120);

    // Display the segmented images for R, G, B channels
    image(segmentedImages.red, 0, 280, 160, 120);
    image(segmentedImages.green, 200, 280, 160, 120);
    image(segmentedImages.blue, 400, 280, 160, 120);

    // Display the original image
    image(scaledPicture, 0, 420, 160, 120);

    // // Display the HSV image if defined
    // if (hsvImage) {
    //   image(hsvImage, 200, 420, 160, 120);
    // }

    // // Display the YCbCr image if defined
    // if (ycbcrImage) {
    //   image(ycbcrImage, 400, 420, 160, 120);
    // }
    // Display the HSV image if defined
    if (hsvImage) {
      image(hsvImage, 200, 420, 160, 120);

      // Perform segmentation on the HSV image
      let segmentedHsvImage = segmentImageHSV(hsvImage);
      image(segmentedHsvImage, 200, 560, 160, 120);
    }
    // Display the YCbCr image if defined
    if (ycbcrImage) {
      image(ycbcrImage, 400, 420, 160, 120);

      // Perform segmentation on the YCbCr image
      let segmentedYcbcrImage = segmentImageYCbCr(ycbcrImage);
      image(segmentedYcbcrImage, 400, 560, 160, 120);
    }
    // Display the original image
    image(scaledPicture, 0, 560, 160, 120);

    // Display face detection results
    drawBox(detections, 0, 560);

    // Apply selected effect to face
    applyEffectToFace(currentFaceModification, detections, 0, 560);
  }
}

// Function to capture a picture from the webcam
function takePicture() {
  picture = video.get();
  scaledPicture = picture.get();
  scaledPicture.resize(160, 120);

  greyPicture = createGreyscaleImage(picture);
  redChannel = extractChannelImage(scaledPicture, 'red');
  greenChannel = extractChannelImage(scaledPicture, 'green');
  blueChannel = extractChannelImage(scaledPicture, 'blue');

  hsvImage = rgbToHsv(scaledPicture);
  ycbcrImage = rgbToYCbCr(redChannel);

  faceapi.detectSingle(scaledPicture, gotResults);
  hasTakenPicture = true;
}

// Function to create a greyscale image with increased brightness
function createGreyscaleImage(src) {
  let greyImage = src.get();
  greyImage.loadPixels();

  for (let i = 0; i < greyImage.pixels.length; i += 4) {
    let r = greyImage.pixels[i];
    let g = greyImage.pixels[i + 1];
    let b = greyImage.pixels[i + 2];

    let grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
    let increasedBrightness = constrain(grayValue * 1.2, 0, 255);

    greyImage.pixels[i] = increasedBrightness;
    greyImage.pixels[i + 1] = increasedBrightness;
    greyImage.pixels[i + 2] = increasedBrightness;
  }

  greyImage.updatePixels();
  return greyImage;
}

// Function to extract a specific color channel from an image
function extractChannelImage(img, channel) {
  let extractedChannel = img.get();
  extractedChannel.loadPixels();

  for (let i = 0; i < extractedChannel.pixels.length; i += 4) {
    if (channel === 'red') {
      extractedChannel.pixels[i + 1] = 0;
      extractedChannel.pixels[i + 2] = 0;
    } else if (channel === 'green') {
      extractedChannel.pixels[i] = 0;
      extractedChannel.pixels[i + 2] = 0;
    } else if (channel === 'blue') {
      extractedChannel.pixels[i] = 0;
      extractedChannel.pixels[i + 1] = 0;
    }
  }

  extractedChannel.updatePixels();
  return extractedChannel;
}

// Function to convert an RGB image to HSV color space
function rgbToHsv(src) {
  let hsv = createImage(src.width, src.height);
  hsv.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let c = src.get(x, y);
      let hsb = rgbToHsb(red(c), green(c), blue(c));
      let index = (x + y * hsv.width) * 4;
      hsv.pixels[index] = hsb[0];
      hsv.pixels[index + 1] = hsb[1];
      hsv.pixels[index + 2] = hsb[2];
      hsv.pixels[index + 3] = alpha(c);
    }
  }

  hsv.updatePixels();
  return hsv;
}

// Function to convert an RGB image to YCbCr color space
function rgbToYCbCr(src) {
  let ycbcr = createImage(src.width, src.height);
  ycbcr.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let c = src.get(x, y);
      let ycbcrValues = rgbToYCbCrValues(red(c), green(c), blue(c));
      let index = (x + y * ycbcr.width) * 4;
      ycbcr.pixels[index] = ycbcrValues[0];
      ycbcr.pixels[index + 1] = ycbcrValues[1];
      ycbcr.pixels[index + 2] = ycbcrValues[2];
      ycbcr.pixels[index + 3] = alpha(c);
    }
  }

  ycbcr.updatePixels();
  return ycbcr;
}

// Function to convert RGB to HSB values
function rgbToHsb(r, g, b) {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, v = max;

  let d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, v];
}

// Function to convert RGB to YCbCr values
function rgbToYCbCrValues(r, g, b) {
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let cb = 0.564 * (b - y);
  let cr = 0.713 * (r - y);

  return [y, cb, cr];
}

// Function to segment an image based on slider thresholds
function segmentImageSliders(src, redThreshold, greenThreshold, blueThreshold) {
  let segmentedRedImage = createImage(src.width, src.height);
  let segmentedGreenImage = createImage(src.width, src.height);
  let segmentedBlueImage = createImage(src.width, src.height);

  segmentedRedImage.loadPixels();
  segmentedGreenImage.loadPixels();
  segmentedBlueImage.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let c = src.get(x, y);
      let redValue = red(c);
      let greenValue = green(c);
      let blueValue = blue(c);

      let segmentedRedValue = redValue > redThreshold ? 255 : 0;
      let segmentedGreenValue = greenValue > greenThreshold ? 255 : 0;
      let segmentedBlueValue = blueValue > blueThreshold ? 255 : 0;

      let index = (x + y * src.width) * 4;

      segmentedRedImage.pixels[index] = segmentedRedValue;
      segmentedRedImage.pixels[index + 1] = 0;
      segmentedRedImage.pixels[index + 2] = 0;
      segmentedRedImage.pixels[index + 3] = alpha(c);

      segmentedGreenImage.pixels[index] = 0;
      segmentedGreenImage.pixels[index + 1] = segmentedGreenValue;
      segmentedGreenImage.pixels[index + 2] = 0;
      segmentedGreenImage.pixels[index + 3] = alpha(c);

      segmentedBlueImage.pixels[index] = 0;
      segmentedBlueImage.pixels[index + 1] = 0;
      segmentedBlueImage.pixels[index + 2] = segmentedBlueValue;
      segmentedBlueImage.pixels[index + 3] = alpha(c);
    }
  }

  segmentedRedImage.updatePixels();
  segmentedGreenImage.updatePixels();
  segmentedBlueImage.updatePixels();

  return {
    red: segmentedRedImage,
    green: segmentedGreenImage,
    blue: segmentedBlueImage
  };
}

function segmentImageHSV(src) {
  let segmentedImage = createImage(src.width, src.height);
  segmentedImage.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let index = (x + y * src.width) * 4;
      
      // Calculate HSV values
      let hueValue =src.pixels[index];
      let saturationValue = src.pixels[index + 1];
      let brightnessValue = src.pixels[index + 2];

      // Segmentation criteria (Adjust these!)
      let isSegmented = (hueValue >= 0 && hueValue <= 200) && 
                        (saturationValue >= 0 && saturationValue <= 255) && 
                        (brightnessValue >= 0 && brightnessValue <= 255);

      // Segmentation
      let segmentedPixelValue = isSegmented ? 255 : 0;
      segmentedImage.pixels[index] = segmentedPixelValue;
      segmentedImage.pixels[index + 1] = segmentedPixelValue;
      segmentedImage.pixels[index + 2] = segmentedPixelValue;
      segmentedImage.pixels[index + 3] = src.pixels[index + 3]; // Alpha 
    }
  }
  segmentedImage.updatePixels();
  return segmentedImage;
}


function segmentImageYCbCr(src) {
  let segmentedImage = createImage(src.width, src.height);
  segmentedImage.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let index = (x + y * src.width) * 4;
      let yValue = src.pixels[index];
      let cbValue = src.pixels[index + 1];
      let crValue = src.pixels[index + 2];

      // Define your segmentation criteria here
      // For example, you can segment based on Y range (e.g., 50-200), Cb range, and Cr range
      let isSegmented = (yValue >= 50 && yValue <= 200) &&
                        (cbValue >= 0 && cbValue <= 255) &&
                        (crValue >= 0 && crValue <= 255);

      let segmentedPixelValue = isSegmented ? 255 : 0;

      segmentedImage.pixels[index] = segmentedPixelValue;
      segmentedImage.pixels[index + 1] = segmentedPixelValue;
      segmentedImage.pixels[index + 2] = segmentedPixelValue;
      segmentedImage.pixels[index + 3] = src.pixels[index + 3]; // Alpha value
    }
  }

  segmentedImage.updatePixels();
  return segmentedImage;
}
// Callback function when face detection model is ready
function modelReady() {
  console.log("Face detection model ready!");
}

// Callback function when face detection results are obtained
function gotResults(err, result) {
  if (err) {
    console.log(err);
    return;
  }

  detections = result;
  if (detections) {
    drawBox(detections, 0, 560, 160, 120);
    alert("No face detected! Please try again.");
  }
}

// Function to draw a rectangle around detected face
function drawBox(detections, offsetX, offsetY) {
  if (detections) {
    const alignedRect = detections.alignedRect;
    const { _x, _y, _width, _height } = alignedRect._box;

    noFill();
    stroke(161, 95, 251);
    strokeWeight(2);
    rect(_x + offsetX, _y + offsetY, _width, _height);
  }
}

// Function to apply the selected effect to the detected face
function applyEffectToFace(effect, detections, offsetX, offsetY) {
  if (hasapplyEffectToFace) {
    console.log("Effect has already been applied. Skipping...");
    return;
  }
  if (detections) {
    const alignedRect = detections.alignedRect;
    const { _x, _y, _width, _height } = alignedRect._box;
    outimage = createImage(_width, _height);
    let faceImage;

    switch (effect) {
      case 'greyscale':
        faceImage = createGreyscaleImage(scaledPicture.get(_x, _y, _width, _height));
        break;
      case 'blurred':
        let blurredImage = scaledPicture.get(_x, _y, _width, _height);
        blurredImage.filter(BLUR, 15);
        faceImage = blurredImage;
        break;
      case 'colorConverted':
        if (currentFaceModification === 'colorConverted') {
          faceImage = hsvImage.get(_x, _y, _width, _height);
        }
        break;
      case 'pixelate':
        faceImage = scaledPicture.get(_x, _y, _width, _height);
        faceImage = applyPixelationToFace(faceImage);
        break;
      default:
        faceImage = scaledPicture.get(_x, _y, _width, _height);
    }

    image(faceImage, _x + offsetX, _y + offsetY, _width, _height);
  }
}

// Function to apply pixelation effect to a face
function applyPixelationToFace(faceImage, offsetX, offsetY) {
  faceImage = createGreyscaleImage(scaledPicture);
  const pixelatedImage = createImage(faceImage.width, faceImage.height);
  pixelatedImage.loadPixels();

  const blockSize = 5;

  for (let y = 0; y < faceImage.height; y += blockSize) {
    for (let x = 0; x < faceImage.width; x += blockSize) {
      let totalRed = 0;
      let totalGreen = 0;
      let totalBlue = 0;
      let numPixels = 0;

      for (let blockY = 0; blockY < blockSize; blockY++) {
        for (let blockX = 0; blockX < blockSize; blockX++) {
          const currentX = x + blockX;
          const currentY = y + blockY;

          if (currentX < faceImage.width && currentY < faceImage.height) {
            const pixelIndex = (currentX + currentY * faceImage.width) * 4;
            totalRed += faceImage.pixels[pixelIndex];
            totalGreen += faceImage.pixels[pixelIndex + 1];
            totalBlue += faceImage.pixels[pixelIndex + 2];
            numPixels++;
          }
        }
      }

      const averageRed = totalRed / numPixels;
      const averageGreen = totalGreen / numPixels;
      const averageBlue = totalBlue / numPixels;

      for (let blockY = 0; blockY < blockSize; blockY++) {
        for (let blockX = 0; blockX < blockSize; blockX++) {
          const currentX = x + blockX;
          const currentY = y + blockY;

          if (currentX < pixelatedImage.width && currentY < pixelatedImage.height) {
            const pixelIndex = (currentX + currentY * pixelatedImage.width) * 4;
            pixelatedImage.pixels[pixelIndex] = averageRed;
            pixelatedImage.pixels[pixelIndex + 1] = averageGreen;
            pixelatedImage.pixels[pixelIndex + 2] = averageBlue;
            pixelatedImage.pixels[pixelIndex + 3] = 255;
          }
        }
      }
    }
  }

  pixelatedImage.updatePixels();
  return pixelatedImage;
}