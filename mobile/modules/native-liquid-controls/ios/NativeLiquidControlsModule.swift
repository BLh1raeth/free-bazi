import ExpoModulesCore
import UIKit

/**
 A standard UIKit UIButton. On iOS 26 and later it uses Apple's own
 UIButton.Configuration.glass(), with no background, tint, blur, or animation
 supplied by the app.
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
/** A native glass segmented control built from Apple's UIKit glass buttons. */
public final class NativeLiquidSegmentedView: ExpoView {
  let onSelectionChange = EventDispatcher()
  private let stack = UIStackView()
  private var buttons: [UIButton] = []
  private var options: [String] = []
  private var selectedIndex = 0
  private var isControlDisabled = false

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    stack.translatesAutoresizingMaskIntoConstraints = false
    stack.axis = .horizontal
    stack.alignment = .fill
    stack.distribution = .fillEqually
    stack.spacing = 4
    addSubview(stack)
    NSLayoutConstraint.activate([
      stack.leadingAnchor.constraint(equalTo: leadingAnchor),
      stack.trailingAnchor.constraint(equalTo: trailingAnchor),
      stack.topAnchor.constraint(equalTo: topAnchor),
      stack.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  func setOptions(_ values: [String]) {
    options = values
    buttons.forEach { $0.removeFromSuperview() }
    buttons.removeAll(keepingCapacity: true)
    for (index, value) in values.enumerated() {
      let button = UIButton(type: .system)
      button.tag = index
      button.titleLabel?.font = .preferredFont(forTextStyle: .subheadline)
      button.addTarget(self, action: #selector(selectionChanged(_:)), for: .touchUpInside)
      if #available(iOS 26.0, *) {
        var configuration = UIButton.Configuration.glass()
        configuration.title = value
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 5, leading: 8, bottom: 5, trailing: 8)
        button.configuration = configuration
      } else {
        var configuration = UIButton.Configuration.bordered()
        configuration.title = value
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 5, leading: 8, bottom: 5, trailing: 8)
        button.configuration = configuration
      }
      buttons.append(button)
      stack.addArrangedSubview(button)
    }
    selectedIndex = values.isEmpty ? 0 : min(max(selectedIndex, 0), values.count - 1)
    applySelection()
  }

  func setSelectedIndex(_ value: Int) {
    selectedIndex = options.isEmpty ? 0 : min(max(0, value), options.count - 1)
    applySelection()
  }

  func setDisabled(_ value: Bool) {
    isControlDisabled = value
    buttons.forEach { $0.isEnabled = !value }
  }

  private func applySelection() {
    buttons.forEach { $0.isSelected = $0.tag == selectedIndex; $0.isEnabled = !isControlDisabled }
  }

  @objc private func selectionChanged(_ sender: UIButton) {
    let index = sender.tag
    guard options.indices.contains(index) else { return }
    selectedIndex = index
    applySelection()
    onSelectionChange(["value": options[index]])
  }
}

/** A native UITabBar; UIKit owns its material, animation, and accessibility. */
public final class NativeLiquidTabBarView: ExpoView, UITabBarDelegate {
  let onSelectionChange = EventDispatcher()
  private let tabBar = UITabBar()
  private let tabs: [(id: String, title: String, symbol: String)] = [
    ("input", "\u{6392}\u{76D8}", "square.and.pencil"),
    ("archive", "\u{6863}\u{6848}\u{5E93}", "folder"),
    ("settings", "\u{8BBE}\u{7F6E}", "gearshape"),
  ]

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    tabBar.translatesAutoresizingMaskIntoConstraints = false
    tabBar.delegate = self
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

public final class NativeLiquidButtonModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidButton")
    View(NativeLiquidButtonView.self) {
      Prop("title") { (view, value: String) in view.setTitle(value) }
      Prop("systemImage") { (view, value: String?) in view.setSystemImage(value) }
      Prop("disabled", false) { (view, value: Bool) in view.setDisabled(value) }
      Prop("selected", false) { (view, value: Bool) in view.setSelected(value) }
      Events("onPress")
    }
  }
}

public final class NativeLiquidSegmentedModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidSegmented")
    View(NativeLiquidSegmentedView.self) {
      Prop("options") { (view, value: [String]) in view.setOptions(value) }
      Prop("selectedIndex") { (view, value: Int) in view.setSelectedIndex(value) }
      Prop("disabled", false) { (view, value: Bool) in view.setDisabled(value) }
      Events("onSelectionChange")
    }
  }
}

public final class NativeLiquidTabBarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidTabBar")
    View(NativeLiquidTabBarView.self) {
      Prop("selectedTab") { (view, value: String) in view.setSelectedTab(value) }
      Events("onSelectionChange")
    }
  }
}
