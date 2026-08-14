import ExpoModulesCore
import UIKit

/**
 A standard UIKit UIButton. On iOS 26 and later it uses Apple's own
 UIButton.Configuration.glass(), with no background, tint, blur, or animation
 supplied by the app. That lets iOS provide the same Liquid Glass material and
 accessibility adaptations as other native apps.
 */
public final class NativeLiquidButtonView: ExpoView {
  let onPress = EventDispatcher()
  private let button = UIButton(type: .system)

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    button.translatesAutoresizingMaskIntoConstraints = false
    button.titleLabel?.font = .preferredFont(forTextStyle: .headline)
    button.addTarget(self, action: #selector(didPress), for: .touchUpInside)
    addSubview(button)
    NSLayoutConstraint.activate([
      button.leadingAnchor.constraint(equalTo: leadingAnchor),
      button.trailingAnchor.constraint(equalTo: trailingAnchor),
      button.topAnchor.constraint(equalTo: topAnchor),
      button.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    refreshConfiguration()
  }

  private var title = ""
  private var systemImage: String?
  private var isControlDisabled = false
  private var isControlSelected = false

  func setTitle(_ value: String) {
    title = value
    refreshConfiguration()
  }

  func setSystemImage(_ value: String?) {
    systemImage = value
    refreshConfiguration()
  }

  func setDisabled(_ value: Bool) {
    isControlDisabled = value
    button.isEnabled = !value
  }

  func setSelected(_ value: Bool) {
    isControlSelected = value
    button.isSelected = value
  }

  private func refreshConfiguration() {
    if #available(iOS 26.0, *) {
      // Deliberately use Apple's default glass configuration without changing
      // the background, corner radius, tint, or transition behaviour.
      var configuration = UIButton.Configuration.glass()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      button.configuration = configuration
    } else {
      var configuration = UIButton.Configuration.bordered()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      button.configuration = configuration
    }
    button.isSelected = isControlSelected
    button.isEnabled = !isControlDisabled
  }

  @objc private func didPress() {
    onPress([:])
  }
}

/**
 Uses UISegmentedControl directly. Standard UIKit controls automatically adopt
 the current system's Liquid Glass appearance when built with Xcode 26+.
 */
public final class NativeLiquidSegmentedView: ExpoView {
  let onSelectionChange = EventDispatcher()
  private let control = UISegmentedControl(items: [])
  private var options: [String] = []

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    control.translatesAutoresizingMaskIntoConstraints = false
    control.addTarget(self, action: #selector(selectionChanged), for: .valueChanged)
    addSubview(control)
    NSLayoutConstraint.activate([
      control.leadingAnchor.constraint(equalTo: leadingAnchor),
      control.trailingAnchor.constraint(equalTo: trailingAnchor),
      control.topAnchor.constraint(equalTo: topAnchor),
      control.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  func setOptions(_ values: [String]) {
    options = values
    control.removeAllSegments()
    for (index, value) in values.enumerated() {
      control.insertSegment(withTitle: value, at: index, animated: false)
    }
    if control.selectedSegmentIndex >= values.count {
      control.selectedSegmentIndex = values.isEmpty ? UISegmentedControl.noSegment : 0
    }
  }

  func setSelectedIndex(_ value: Int) {
    guard !options.isEmpty else {
      control.selectedSegmentIndex = UISegmentedControl.noSegment
      return
    }
    control.selectedSegmentIndex = min(max(0, value), options.count - 1)
  }

  func setDisabled(_ value: Bool) {
    control.isEnabled = !value
  }

  @objc private func selectionChanged() {
    let index = control.selectedSegmentIndex
    guard options.indices.contains(index) else { return }
    onSelectionChange(["value": options[index]])
  }
}

/**
 A native UITabBar with no custom appearance. UIKit owns its glass material,
 focus animation, translucency, and accessibility behaviour on iOS 26+.
 */
public final class NativeLiquidTabBarView: ExpoView, UITabBarDelegate {
  let onSelectionChange = EventDispatcher()
  private let tabBar = UITabBar()
  private let tabs: [(id: String, title: String, symbol: String)] = [
    ("input", "排盘", "square.and.pencil"),
    ("archive", "档案库", "folder"),
    ("settings", "设置", "gearshape"),
  ]

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    tabBar.translatesAutoresizingMaskIntoConstraints = false
    tabBar.delegate = self
    // Do not set standardAppearance/scrollEdgeAppearance/backgroundImage.
    // Those custom appearances interfere with the platform Liquid Glass layer.
    tabBar.items = tabs.enumerated().map { index, tab in
      UITabBarItem(title: tab.title, image: UIImage(systemName: tab.symbol), tag: index)
    }
    addSubview(tabBar)
    NSLayoutConstraint.activate([
      tabBar.leadingAnchor.constraint(equalTo: leadingAnchor),
      tabBar.trailingAnchor.constraint(equalTo: trailingAnchor),
      tabBar.topAnchor.constraint(equalTo: topAnchor),
      tabBar.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  func setSelectedTab(_ value: String) {
    guard let index = tabs.firstIndex(where: { $0.id == value }) else { return }
    tabBar.selectedItem = tabBar.items?[index]
  }

  public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    guard tabs.indices.contains(item.tag) else { return }
    onSelectionChange(["value": tabs[item.tag].id])
  }
}

public final class NativeLiquidControlsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidControls")

    View(NativeLiquidButtonView.self) {
      Prop("title") { (view, value: String) in
        view.setTitle(value)
      }
      Prop("systemImage") { (view, value: String?) in
        view.setSystemImage(value)
      }
      Prop("disabled", false) { (view, value: Bool) in
        view.setDisabled(value)
      }
      Prop("selected", false) { (view, value: Bool) in
        view.setSelected(value)
      }
      Events("onPress")
    }

    View(NativeLiquidSegmentedView.self) {
      Prop("options") { (view, value: [String]) in
        view.setOptions(value)
      }
      Prop("selectedIndex") { (view, value: Int) in
        view.setSelectedIndex(value)
      }
      Prop("disabled", false) { (view, value: Bool) in
        view.setDisabled(value)
      }
      Events("onSelectionChange")
    }

    View(NativeLiquidTabBarView.self) {
      Prop("selectedTab") { (view, value: String) in
        view.setSelectedTab(value)
      }
      Events("onSelectionChange")
    }
  }
}
