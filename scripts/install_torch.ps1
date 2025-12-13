# PowerShell script to install PyTorch with CUDA support
# This script installs PyTorch with CUDA 12.4 support, which is compatible with CUDA 12.9

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "PyTorch CUDA Installation Script" -ForegroundColor Cyan
Write-Host "Target: PyTorch 2.6.0 with CUDA 12.4 support" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Uninstall existing PyTorch packages
Write-Host "Step 1: Uninstalling existing PyTorch packages..." -ForegroundColor Yellow
pip uninstall -y torch torchvision torchaudio
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

# Step 2: Install PyTorch with CUDA 12.4 support
Write-Host "Step 2: Installing PyTorch with CUDA 12.4 support..." -ForegroundColor Yellow
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
Write-Host "Done!" -ForegroundColor Green
Write-Host ""

# Step 3: Verify installation
Write-Host "Step 3: Verifying CUDA availability..." -ForegroundColor Yellow
python -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available()); print('CUDA version:', torch.version.cuda if torch.cuda.is_available() else 'N/A'); print('Number of GPUs:', torch.cuda.device_count() if torch.cuda.is_available() else 0)"
Write-Host ""

# Step 4: Test GPU
Write-Host "Step 4: Testing GPU device..." -ForegroundColor Yellow
python -c "import torch; print('GPU Name:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'No GPU detected')"
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
