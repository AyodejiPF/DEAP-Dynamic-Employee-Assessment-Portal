# STAFFIQ IAM FIX — Run this in a terminal to fix 403 on new Cloud Functions
# Prerequisites: gcloud auth login (opens browser)
# After auth, run this script:

Write-Host "=== Fixing IAM for 10 new StaffiQ billing/grants functions ==="

$functions = @(
    "staffiqGrantCreate",
    "staffiqGrantRevoke",
    "staffiqGrantList",
    "staffiqWebhookPaystack",
    "staffiqCreateCheckout",
    "staffiqGetSubscription",
    "staffiqPreviewUpgrade",
    "staffiqExecuteUpgrade",
    "staffiqScheduleDowngrade",
    "staffiqCancelSubscription"
)

foreach ($fn in $functions) {
    Write-Host "Adding allUsers invoker to $fn..."
    gcloud run services add-iam-policy-binding $fn `
        --region=us-central1 `
        --member="allUsers" `
        --role="roles/run.invoker" `
        --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $fn — done"
    } else {
        Write-Host "  ❌ $fn — failed"
    }
}

Write-Host ""
Write-Host "=== Testing endpoints ==="
foreach ($fn in $functions) {
    try {
        $r = Invoke-WebRequest "https://us-central1-iicocece-assessment.cloudfunctions.net/$fn" -Method OPTIONS -Headers @{Origin="https://staffiq.ng"} -SkipCertificateCheck -TimeoutSec 5
        Write-Host "  ✅ $fn -> $($r.StatusCode)"
    } catch {
        Write-Host "  ❌ $fn -> $($_.Exception.Response.StatusCode.value__)"
    }
}

Write-Host ""
Write-Host "=== Done ==="
Write-Host "Now redeploy hosting: cd staffiq-website ; npx firebase deploy --only hosting --project iicocece-assessment"
