param(
  [string]$AppPath = "testapp"
)

$gradleFile = Join-Path $AppPath "android\build.gradle"
if (-not (Test-Path $gradleFile)) {
  Write-Error "Gradle file not found: $gradleFile"
  exit 1
}

$snippet = @"
subprojects { subproject ->
    afterEvaluate {
        if (subproject.plugins.hasPlugin('com.android.library') || subproject.plugins.hasPlugin('com.android.application')) {
            subproject.android.compileOptions {
                sourceCompatibility JavaVersion.VERSION_17
                targetCompatibility JavaVersion.VERSION_17
            }
        }
    }
}
"@

Add-Content -Path $gradleFile -Value $snippet

Push-Location (Join-Path $AppPath "android")
./gradlew.bat assembleDebug
Pop-Location