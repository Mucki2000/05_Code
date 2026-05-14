"""Extract the last frame of the WhatsApp video, plus a tight-cropped version for the navbar."""
import subprocess
import imageio_ffmpeg as iio
import os

src = r"G:\Meine Ablage\Lausebengel\05_Code\WhatsApp Video 2026-05-14 at 02.07.43.mp4"
full = r"G:\Meine Ablage\Lausebengel\05_Code\assets\lausebengel-logo-full.png"
cropped = r"G:\Meine Ablage\Lausebengel\05_Code\assets\lausebengel-logo.png"
ffmpeg = iio.get_ffmpeg_exe()

# Full last frame (single image — use -update 1 to suppress warning).
subprocess.run(
    [ffmpeg, "-sseof", "-0.1", "-i", src, "-frames:v", "1", "-update", "1", "-y", full],
    capture_output=True, text=True, check=True
)

# Tight crop around the wordmark. Frame is 848x480; wordmark sits roughly
# x: 170-680, y: 175-330. Crop = w:510 h:155 x:170 y:175.
subprocess.run(
    [ffmpeg, "-sseof", "-0.1", "-i", src,
     "-frames:v", "1", "-update", "1",
     "-vf", "crop=510:155:170:175",
     "-y", cropped],
    capture_output=True, text=True, check=True
)

print("Full frame:", os.path.exists(full), os.path.getsize(full) if os.path.exists(full) else "")
print("Cropped:", os.path.exists(cropped), os.path.getsize(cropped) if os.path.exists(cropped) else "")
