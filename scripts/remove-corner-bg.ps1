# Remove the background color from window screenshot corners via flood-fill.
# Samples the color at each corner pixel and makes adjacent matching pixels transparent.
#
# Usage:
#   .\scripts\remove-corner-bg.ps1 -Input path\to\input.png -Output path\to\output.png
#   .\scripts\remove-corner-bg.ps1 -Input path\to\input.png -Output path\to\output.png -Tolerance 40
#
# Tolerance: color distance threshold (0-255). Default 30.
# Lower = only near-exact matches. Higher = also catches anti-aliased edges.

param(
    [Parameter(Mandatory)][string]$Input,
    [Parameter(Mandatory)][string]$Output,
    [int]$Tolerance = 30
)

Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Image]::FromFile((Resolve-Path $Input))
$bmp = New-Object System.Drawing.Bitmap $img
$img.Dispose()

$w = $bmp.Width
$h = $bmp.Height

function ColorDist($a, $b) {
    [Math]::Sqrt(
        [Math]::Pow($a.R - $b.R, 2) +
        [Math]::Pow($a.G - $b.G, 2) +
        [Math]::Pow($a.B - $b.B, 2)
    )
}

$visited     = New-Object 'bool[,]' $w, $h
$queue       = New-Object System.Collections.Generic.Queue[System.Drawing.Point]
$transparent = [System.Drawing.Color]::Transparent

$seeds = @(
    [System.Drawing.Point]::new(0,    0   ),
    [System.Drawing.Point]::new($w-1, 0   ),
    [System.Drawing.Point]::new(0,    $h-1),
    [System.Drawing.Point]::new($w-1, $h-1)
)

foreach ($seed in $seeds) {
    if ($visited[$seed.X, $seed.Y]) { continue }

    $bgColor = $bmp.GetPixel($seed.X, $seed.Y)
    $queue.Enqueue($seed)
    $visited[$seed.X, $seed.Y] = $true

    while ($queue.Count -gt 0) {
        $pt = $queue.Dequeue()
        $px = $bmp.GetPixel($pt.X, $pt.Y)
        if ((ColorDist $px $bgColor) -le $Tolerance) {
            $bmp.SetPixel($pt.X, $pt.Y, $transparent)
            foreach ($d in @(
                [System.Drawing.Point]::new($pt.X+1, $pt.Y  ),
                [System.Drawing.Point]::new($pt.X-1, $pt.Y  ),
                [System.Drawing.Point]::new($pt.X,   $pt.Y+1),
                [System.Drawing.Point]::new($pt.X,   $pt.Y-1)
            )) {
                if ($d.X -ge 0 -and $d.X -lt $w -and $d.Y -ge 0 -and $d.Y -lt $h -and -not $visited[$d.X, $d.Y]) {
                    $visited[$d.X, $d.Y] = $true
                    $queue.Enqueue($d)
                }
            }
        }
    }
}

$bmp.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Saved: $Output"
