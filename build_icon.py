from PIL import Image, ImageDraw

def create_app_icon(output_path="app.ico"):
    size = 256
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = 8
    # Outer circle border
    draw.ellipse([margin, margin, size - margin, size - margin], fill=(15, 23, 42, 255), outline=(99, 102, 241, 255), width=8)

    # Core node
    center = size // 2
    r = 60
    draw.ellipse([center - r, center - r, center + r, center + r], fill=(99, 102, 241, 255))

    # Satellites
    draw.ellipse([center + 50, center - 80, center + 90, center - 40], fill=(52, 211, 153, 255))
    draw.ellipse([center - 90, center + 40, center - 50, center + 80], fill=(56, 189, 248, 255))

    # Inner eye/core
    draw.ellipse([center - 20, center - 20, center + 20, center + 20], fill=(255, 255, 255, 255))

    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(output_path, format="ICO", sizes=sizes)
    print(f"Icon created at: {output_path}")

if __name__ == "__main__":
    create_app_icon()
