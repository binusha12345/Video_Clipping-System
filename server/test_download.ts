import { downloadVideo } from './src/services/youtube/downloader';

async function test() {
  try {
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // Me at the zoo
    const result = await downloadVideo(url, 'test_project_id');
    console.log(result);
  } catch (err) {
    console.error(err);
  }
}

test();
