import { pickNextLiveTrack } from './src/db/api';
import { supabase } from './src/db/supabase';

async function test() {
  try {
    console.log("Starting test...");
    const track = await pickNextLiveTrack();
    console.log("Picked track:", JSON.stringify(track, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}
test();
