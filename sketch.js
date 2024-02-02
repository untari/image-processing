let video;
let picture;
let scaledPicture;
let greyPicture;
let redChannel, greenChannel, blueChannel;

function setup() {
  createCanvas(640 * 2, 480);
  video = createCapture(VIDEO);
  video.hide();

  // Create a button element
  const captureButton = createButton('Capture Image');
  captureButton.id('captureButton');
  captureButton.mousePressed(takePicture);
}

function draw() {
  background(255);

  // Display the webcam image in the grid at the position titled "Webcam image"
  image(video, 0, 0, 160, 120);

  if (picture) {
    // Display the greyscale version
    image(greyPicture, 200, 0, 160, 120);

    // Split the picture into R, G, B channels
    image(redChannel, 0, 230, 160, 120);
    image(greenChannel, 200, 230, 160, 120);
    image(blueChannel, 400, 230,160, 120);
  }
}

function takePicture() {
  // Take a picture when the button is clicked
  picture = video.get();

  // Scale the picture to 160 x 120 pixels
  scaledPicture = picture.get();
  scaledPicture.resize(160, 120);

  // Convert the picture to greyscale
  greyPicture = picture.get();
  greyPicture.filter(GRAY);

  // Split the scaled picture into R, G, B channels
  redChannel = extractChannelImage(scaledPicture, 'red');
  greenChannel = extractChannelImage(scaledPicture, 'green');
  blueChannel = extractChannelImage(scaledPicture, 'blue');
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
// function savePicture() {
//   // Save picture to disk
//   save(picture, 'picture.png');
// }

