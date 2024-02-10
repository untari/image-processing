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
let redThreshold, greenThreshold, blueThreshold;

function setup() {
  createCanvas(640 * 2, 480);
  video = createCapture(VIDEO);
  video.hide();

  // Create a button element
  const captureButton = createButton('Capture Image');
  captureButton.id('captureButton');
  captureButton.mousePressed(takePicture);

  // Create sliders for threshold control
  redThreshold = createSlider(0, 255, 128);
  greenThreshold = createSlider(0, 255, 128);
  blueThreshold = createSlider(0, 255, 128);
}

function draw() {
  background(255);

  // Display the webcam image in the grid at the position titled "Webcam image"
  image(video, 0, 0, 160, 120);

  if (picture) {
    // Display the greyscale version
    image(greyPicture, 200, 0, 160, 120);


    // Display the original image
    // image(scaledPicture, 400, 0, 160, 120);

    // Perform segmentation with individual channel thresholds
    let segmentedImages = segmentImageSliders(scaledPicture, redThreshold.value(), greenThreshold.value(), blueThreshold.value());

    // Display the R, G, B channels with threshold control
    image(redChannel, 0, 230, 160, 120);
    image(greenChannel, 200, 230, 160, 120);
    image(blueChannel, 400, 230, 160, 120);

    // Display the segmented images for R, G, B channels
    image(segmentedImages.red, 600, 230, 160, 120);
    image(segmentedImages.green, 800, 230, 160, 120);
    image(segmentedImages.blue, 1000, 230, 160, 120);
  }
}

function takePicture() {
  // Take a picture when the button is clicked
  picture = video.get();

  // Scale the picture to 160 x 120 pixels
  scaledPicture = picture.get();
  scaledPicture.resize(160, 120);

  // Create a greyscale version with increased brightness
  greyPicture = createGreyscaleImage(picture);

  // Split the scaled picture into R, G, B channels
  redChannel = extractChannelImage(scaledPicture, 'red');
  greenChannel = extractChannelImage(scaledPicture, 'green');
  blueChannel = extractChannelImage(scaledPicture, 'blue');

  // Convert to HSV color space
  hsvImage = rgbToHsv(scaledPicture);

  // Convert to YCbCr color space
  ycbcrImage = rgbToYCbCr(scaledPicture);
}

function createGreyscaleImage(src) {
  let greyImage = src.get();
  greyImage.loadPixels();

  for (let i = 0; i < greyImage.pixels.length; i += 4) {
    let r = greyImage.pixels[i];
    let g = greyImage.pixels[i + 1];
    let b = greyImage.pixels[i + 2];

    // Convert to grayscale using luminosity method
    let grayValue = 0.299 * r + 0.587 * g + 0.114 * b;

    // Increase brightness by 20% and prevent pixel intensity
    let increasedBrightness = constrain(grayValue * 1.2, 0, 255);

    // Assign the new value
    greyImage.pixels[i] = increasedBrightness;
    greyImage.pixels[i + 1] = increasedBrightness;
    greyImage.pixels[i + 2] = increasedBrightness;
  }

  greyImage.updatePixels();
  return greyImage;
}

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
      hsv.pixels[index + 3] = alpha(c); // Alpha value
    }
  }
  hsv.updatePixels();
  return hsv;
}

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
      ycbcr.pixels[index + 3] = alpha(c); // Alpha value
    }
  }
  ycbcr.updatePixels();
  return ycbcr;
}

function rgbToHsb(r, g, b) {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, v = max;

  let d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
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

function rgbToYCbCrValues(r, g, b) {
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let cb = 0.564 * (b - y);
  let cr = 0.713 * (r - y);

  return [y, cb, cr];
}

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

      // Segmented Red channel
      segmentedRedImage.pixels[index] = segmentedRedValue;
      segmentedRedImage.pixels[index + 1] = 0;
      segmentedRedImage.pixels[index + 2] = 0;
      segmentedRedImage.pixels[index + 3] = alpha(c);

      // Segmented Green channel
      segmentedGreenImage.pixels[index] = 0;
      segmentedGreenImage.pixels[index + 1] = segmentedGreenValue;
      segmentedGreenImage.pixels[index + 2] = 0;
      segmentedGreenImage.pixels[index + 3] = alpha(c);

      // Segmented Blue channel
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

// function savePicture() {
//   // Save picture to disk
//   save(picture, 'picture.png');
// }
