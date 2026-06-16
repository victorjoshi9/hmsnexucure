async function testGithub() {
  const urlBase = "https://raw.githubusercontent.com/vladmandic/face-api/master/model/";
  const files = [
    'tiny_face_detector_model-weights_manifest.json',
    'tiny_face_detector_model.bin',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model.bin',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model.bin',
    'face_expression_model-weights_manifest.json',
    'face_expression_model.bin'
  ];

  for (const file of files) {
    const res = await fetch(urlBase + file);
    if (res.ok) {
      if (file.endsWith('.json')) {
        const data = await res.json();
        console.log(`GitHub master ${file}: Loaded JSON`);
      } else {
        const buf = await res.arrayBuffer();
        console.log(`GitHub master ${file}: ${buf.byteLength} bytes`);
      }
    } else {
      console.log(`GitHub master ${file} Failed:`, res.status, res.statusText);
    }
  }
}
testGithub();
