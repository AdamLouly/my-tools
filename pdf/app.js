class PDFMerger {
    constructor() {
      this.files = []
      this.initializeElements()
      this.bindEvents()
    }
  
    initializeElements() {
      this.uploadArea = document.getElementById("uploadArea")
      this.fileInput = document.getElementById("fileInput")
      this.filesSection = document.getElementById("filesSection")
      this.filesList = document.getElementById("filesList")
      this.mergeBtn = document.getElementById("mergeBtn")
      this.outputName = document.getElementById("outputName")
      this.loading = document.getElementById("loading")
    }
  
    bindEvents() {
      // File input events
      this.fileInput.addEventListener("change", (e) => this.handleFiles(e.target.files))
  
      // Drag and drop events
      this.uploadArea.addEventListener("click", () => this.fileInput.click())
      this.uploadArea.addEventListener("dragover", (e) => this.handleDragOver(e))
      this.uploadArea.addEventListener("dragleave", (e) => this.handleDragLeave(e))
      this.uploadArea.addEventListener("drop", (e) => this.handleDrop(e))
  
      // Merge button
      this.mergeBtn.addEventListener("click", () => this.mergePDFs())
    }
  
    handleDragOver(e) {
      e.preventDefault()
      this.uploadArea.classList.add("dragover")
    }
  
    handleDragLeave(e) {
      e.preventDefault()
      this.uploadArea.classList.remove("dragover")
    }
  
    handleDrop(e) {
      e.preventDefault()
      this.uploadArea.classList.remove("dragover")
      const files = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
      this.handleFiles(files)
    }
  
    async handleFiles(files) {
      for (const file of files) {
        if (file.type === "application/pdf") {
          const fileData = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: this.formatFileSize(file.size),
            arrayBuffer: await file.arrayBuffer(),
          }
          this.files.push(fileData)
        }
      }
      this.renderFilesList()
      this.showFilesSection()
    }
  
    formatFileSize(bytes) {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }
  
    renderFilesList() {
      this.filesList.innerHTML = ""
      this.files.forEach((file, index) => {
        const fileItem = document.createElement("div")
        fileItem.className = "file-item"
        fileItem.draggable = true
        fileItem.dataset.index = index
  
        fileItem.innerHTML = `
                  <div class="drag-handle">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="3" y1="6" x2="21" y2="6"></line>
                          <line x1="3" y1="12" x2="21" y2="12"></line>
                          <line x1="3" y1="18" x2="21" y2="18"></line>
                      </svg>
                  </div>
                  <div class="file-info">
                      <div class="file-name">${file.name}</div>
                      <div class="file-size">${file.size}</div>
                  </div>
                  <button class="remove-btn" onclick="pdfMerger.removeFile(${index})">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                  </button>
              `
  
        // Add drag and drop functionality for reordering
        fileItem.addEventListener("dragstart", (e) => this.handleDragStart(e))
        fileItem.addEventListener("dragover", (e) => this.handleItemDragOver(e))
        fileItem.addEventListener("drop", (e) => this.handleItemDrop(e))
        fileItem.addEventListener("dragend", (e) => this.handleDragEnd(e))
  
        this.filesList.appendChild(fileItem)
      })
    }
  
    handleDragStart(e) {
      e.dataTransfer.setData("text/plain", e.target.dataset.index)
      e.target.classList.add("dragging")
    }
  
    handleItemDragOver(e) {
      e.preventDefault()
    }
  
    handleItemDrop(e) {
      e.preventDefault()
      const draggedIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
      const targetIndex = Number.parseInt(e.target.closest(".file-item").dataset.index)
  
      if (draggedIndex !== targetIndex) {
        this.reorderFiles(draggedIndex, targetIndex)
      }
    }
  
    handleDragEnd(e) {
      e.target.classList.remove("dragging")
    }
  
    reorderFiles(fromIndex, toIndex) {
      const [movedFile] = this.files.splice(fromIndex, 1)
      this.files.splice(toIndex, 0, movedFile)
      this.renderFilesList()
    }
  
    removeFile(index) {
      this.files.splice(index, 1)
      this.renderFilesList()
  
      if (this.files.length === 0) {
        this.hideFilesSection()
      }
    }
  
    showFilesSection() {
      this.filesSection.style.display = "block"
    }
  
    hideFilesSection() {
      this.filesSection.style.display = "none"
    }
  
    async mergePDFs() {
      if (this.files.length === 0) {
        alert("Please upload at least one PDF file.")
        return
      }
  
      this.showLoading()
  
      try {
        const { PDFDocument } = window.PDFLib
        const mergedPdf = await PDFDocument.create()
  
        for (const fileData of this.files) {
          const pdf = await PDFDocument.load(fileData.arrayBuffer)
          const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
          pages.forEach((page) => mergedPdf.addPage(page))
        }
  
        const pdfBytes = await mergedPdf.save()
        const blob = new Blob([pdfBytes], { type: "application/pdf" })
  
        const filename = this.outputName.value.trim() || "merged-document"
        this.downloadFile(blob, `${filename}.pdf`)
      } catch (error) {
        console.error("Error merging PDFs:", error)
        alert("An error occurred while merging the PDFs. Please try again.")
      } finally {
        this.hideLoading()
      }
    }
  
    downloadFile(blob, filename) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  
    showLoading() {
      this.loading.style.display = "block"
      this.filesSection.style.display = "none"
    }
  
    hideLoading() {
      this.loading.style.display = "none"
      this.filesSection.style.display = "block"
    }
  }
  
  // Initialize the PDF merger when the page loads
  const pdfMerger = new PDFMerger()