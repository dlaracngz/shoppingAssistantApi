from flask import Flask, request, jsonify
import requests
import cv2 as cv
import numpy as np
import traceback
import sys

# Log fonksiyonu (stderr — Node.js'te görünür)
def log(msg):
    print(f"[PYTHON LOG]: {msg}", file=sys.stderr)

# Ayarlar
Conf_threshold = 0.4
NMS_threshold = 0.4
COLORS = [(0, 0, 0), (255, 0, 255), (0, 0, 128),
          (255, 0, 0), (0, 255, 0), (0, 255, 255),
          (42, 42, 165), (255, 255, 255), (0, 165, 255), (128, 0, 0)]

class_name = [
    "Doritos Hot Corn Acı Biberli Mısır Cipsi", "Eti Karam %70 Kakaolu Bitter Çikolata", "Yumoş Extra Konsantre Çamaşır Yumuşatıcı Sakura", "Elidor Kepeğe Karşı Etkili 2'si 1 Arada Şampuan",
    "Asya Su", "Tarım Kredi Birlik Demlik Süzen Poşet Siyah Çay 48'li", "Kurukahveci Mehmet Efendi Türk Kahvesi", "Pınar Süzme Peynir", "Pastavilla Kelebek Makarna", "Billur Tuz"
]

# Flask API
app = Flask(__name__)

@app.route('/detect', methods=['POST'])
def detect_objects():
    data = request.get_json()

    # Zorunlu parametre kontrolü
    if not data or 'image_url' not in data:
        log("❌ image_url eksik.")
        return jsonify({"error": "No image URL provided"}), 400

    image_url = data['image_url']
    user_info = data.get('user', {})  # Kullanıcı bilgisi JSON objesi
    user_id = user_info.get('id', 'anonymous')  # ID yoksa 'anonymous' yaz

    log(f"👤 İstek yapan kullanıcı ID: {user_id}")
    log(f"🌐 Alınan resim URL'si: {image_url}")

    try:
        log("🔄 Resim alınıyor...")
        response = requests.get(image_url)

        if response.status_code != 200:
            log(f"❌ Resim alınamadı: HTTP {response.status_code}")
            return jsonify({
                "status": "error",
                "message": "Resim alınırken hata oluştu",
                "details": response.text
            }), 500

        img_array = np.frombuffer(response.content, np.uint8)
        img = cv.imdecode(img_array, cv.IMREAD_COLOR)

        if img is None:
            log("❌ Resim çözümlenemedi (cv.imdecode None döndürdü).")
            return jsonify({"status": "error", "message": "Resim yüklenemedi"}), 400

        log("✅ Resim başarıyla alındı, model yükleniyor...")

        net = cv.dnn.readNet("C:/Users/b_erd/Downloads/ecommerceBackend/server/python/yolov4-tiny-custom.cfg",
                             "C:/Users/b_erd/Downloads/ecommerceBackend/server/python/yolov4-tiny-custom_best.weights")
        model = cv.dnn_DetectionModel(net)
        model.setInputParams(size=(640, 480), scale=1 / 255, swapRB=True)

        log("🧠 Model yüklendi, tespit başlatılıyor...")
        classes, scores, boxes = model.detect(img, Conf_threshold, NMS_threshold)

        log(f"📊 Tespit edilen nesne sayısı: {len(classes)}")
        detected_objects = []
        for (classid, score, box) in zip(classes, scores, boxes):
            classid = int(classid)
            label = class_name[classid] if classid < len(class_name) else f"class_{classid}"
            detected_objects.append({
                "label": label,
                "score": float(score),
                "box": box.tolist()
            })

        # Sadece ilk tespit edilen etiketi almak
        if detected_objects:
            first_object = detected_objects[0]
            result = {
                "status": "success",
                "user_id": user_id,
                "objects": [first_object]  # İlk etiketi döndürüyoruz
            }
        else:
            result = {
                "status": "success",
                "user_id": user_id,
                "objects": []  # Hiçbir nesne tespit edilmediyse boş bir liste döndürüyoruz
            }

        log("✅ Tespit tamamlandı. Sonuç gönderiliyor.")
        return jsonify(result)

    except Exception as e:
        log(f"💥 Hata oluştu: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e),
            "details": traceback.format_exc()
        }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
