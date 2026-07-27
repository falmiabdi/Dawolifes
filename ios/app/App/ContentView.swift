import SwiftUI
import Capacitor

struct CapacitorApp: UIViewRepresentable {
    func makeUIView(context: Context) -> UIView {
        return CapacitorAppViewController()
    }

    func updateUIView(_ uiView: UIView, context: Context) {}
}
