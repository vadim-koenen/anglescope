import AppKit
import AVFoundation
import Foundation

if CommandLine.arguments.count < 3 {
    fputs("usage: encode-demo-video.swift <frames-dir> <output-mp4>\n", stderr)
    exit(64)
}

let framesDirectory = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let width = 1280
let height = 720
let fps = 24
let secondsPerSlide = 9
let framesPerSlide = fps * secondsPerSlide

let frameURLs = try FileManager.default
    .contentsOfDirectory(at: framesDirectory, includingPropertiesForKeys: nil)
    .filter { $0.pathExtension.lowercased() == "png" }
    .sorted { $0.lastPathComponent < $1.lastPathComponent }

if frameURLs.isEmpty {
    fputs("no PNG frames found in \(framesDirectory.path)\n", stderr)
    exit(66)
}

try? FileManager.default.removeItem(at: outputURL)

let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
let settings: [String: Any] = [
    AVVideoCodecKey: AVVideoCodecType.h264,
    AVVideoWidthKey: width,
    AVVideoHeightKey: height,
    AVVideoCompressionPropertiesKey: [
        AVVideoAverageBitRateKey: 2_500_000,
        AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel
    ]
]

let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
input.expectsMediaDataInRealTime = false

let attributes: [String: Any] = [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32ARGB,
    kCVPixelBufferWidthKey as String: width,
    kCVPixelBufferHeightKey as String: height
]

let adaptor = AVAssetWriterInputPixelBufferAdaptor(
    assetWriterInput: input,
    sourcePixelBufferAttributes: attributes
)

guard writer.canAdd(input) else {
    fputs("cannot add video input\n", stderr)
    exit(70)
}

writer.add(input)

func makePixelBuffer(from url: URL) -> CVPixelBuffer {
    guard let nsImage = NSImage(contentsOf: url) else {
        fatalError("unable to read \(url.path)")
    }

    var imageRect = CGRect(origin: .zero, size: nsImage.size)
    guard let cgImage = nsImage.cgImage(forProposedRect: &imageRect, context: nil, hints: nil) else {
        fatalError("unable to create CGImage for \(url.path)")
    }

    var pixelBuffer: CVPixelBuffer?
    let status = CVPixelBufferCreate(
        kCFAllocatorDefault,
        width,
        height,
        kCVPixelFormatType_32ARGB,
        nil,
        &pixelBuffer
    )

    guard status == kCVReturnSuccess, let buffer = pixelBuffer else {
        fatalError("unable to create pixel buffer")
    }

    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

    guard let context = CGContext(
        data: CVPixelBufferGetBaseAddress(buffer),
        width: width,
        height: height,
        bitsPerComponent: 8,
        bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
    ) else {
        fatalError("unable to create CGContext")
    }

    context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: width, height: height))
    context.draw(cgImage, in: CGRect(x: 0, y: 0, width: width, height: height))

    return buffer
}

guard writer.startWriting() else {
    fputs("writer failed to start: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(70)
}

writer.startSession(atSourceTime: .zero)

let frameDuration = CMTime(value: 1, timescale: CMTimeScale(fps))
var frameIndex: Int64 = 0

for url in frameURLs {
    let pixelBuffer = makePixelBuffer(from: url)

    for _ in 0..<framesPerSlide {
        while !input.isReadyForMoreMediaData {
            Thread.sleep(forTimeInterval: 0.01)
        }

        let presentationTime = CMTimeMultiply(frameDuration, multiplier: Int32(frameIndex))
        if !adaptor.append(pixelBuffer, withPresentationTime: presentationTime) {
            fputs("append failed at frame \(frameIndex): \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
            exit(70)
        }
        frameIndex += 1
    }
}

input.markAsFinished()

let semaphore = DispatchSemaphore(value: 0)
writer.finishWriting {
    semaphore.signal()
}
semaphore.wait()

if writer.status != .completed {
    fputs("writer failed: \(writer.error?.localizedDescription ?? "unknown")\n", stderr)
    exit(70)
}

print(outputURL.path)
