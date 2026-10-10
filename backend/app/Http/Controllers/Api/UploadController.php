<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SiteSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /** POST /api/uploads (multipart "image") -> { url } */
    public function store(Request $request): JsonResponse
    {
        if (SiteSettings::get('allow_uploads') !== '1' && ! $request->user('sanctum')?->is_admin) {
            return response()->json(['message' => 'Image uploads are disabled.'], 403);
        }
        $max = (int) config('pickerplay.max_upload_kb', 4096);
        $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,gif,webp', 'max:'.$max],
        ]);

        return response()->json(['url' => self::storeImage($request->file('image'))], 201);
    }

    /** Re-encodes through GD when possible (strips metadata / payloads), else stores as-is. */
    public static function storeImage(\Illuminate\Http\UploadedFile $file, string $folder = 'img'): string
    {
        $ext = strtolower($file->guessExtension() ?: 'png');
        if (! in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true)) {
            abort(422, 'Unsupported image type.');
        }
        $info = @getimagesize($file->getRealPath());
        if (! $info) {
            abort(422, 'The file is not a valid image.');
        }
        $dir = $folder.'/'.date('Y/m');
        $name = Str::random(24);
        $disk = Storage::disk('uploads');

        if ($ext !== 'gif' && function_exists('imagecreatefromstring') && function_exists('imagewebp')) {
            $src = @imagecreatefromstring(file_get_contents($file->getRealPath()));
            if ($src) {
                [$w, $h] = [imagesx($src), imagesy($src)];
                $maxSide = 1600;
                if (max($w, $h) > $maxSide) {
                    $ratio = $maxSide / max($w, $h);
                    $dst = imagecreatetruecolor((int) ($w * $ratio), (int) ($h * $ratio));
                    imagealphablending($dst, false);
                    imagesavealpha($dst, true);
                    imagecopyresampled($dst, $src, 0, 0, 0, 0, imagesx($dst), imagesy($dst), $w, $h);
                    imagedestroy($src);
                    $src = $dst;
                } else {
                    imagepalettetotruecolor($src);
                    imagealphablending($src, false);
                    imagesavealpha($src, true);
                }
                ob_start();
                imagewebp($src, null, 85);
                $bytes = ob_get_clean();
                imagedestroy($src);
                $path = "{$dir}/{$name}.webp";
                $disk->put($path, $bytes);

                return '/uploads/'.$path;
            }
        }
        $path = $file->storeAs($dir, "{$name}.{$ext}", 'uploads');

        return '/uploads/'.$path;
    }
}
