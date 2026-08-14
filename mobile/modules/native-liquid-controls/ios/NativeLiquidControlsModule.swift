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
  private var fontSize: Double?

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

  func setFontSize(_ value: Double?) {
    fontSize = value
    refreshConfiguration()
  }

  private func refreshConfiguration() {
    if #available(iOS 26.0, *) {
      var configuration = UIButton.Configuration.glass()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      configuration.titleLineBreakMode = .byTruncatingTail
      applyFontSize(to: &configuration)
      button.configuration = configuration
    } else {
      var configuration = UIButton.Configuration.bordered()
      configuration.title = title
      configuration.image = systemImage.flatMap(UIImage.init(systemName:))
      configuration.imagePadding = systemImage == nil ? 0 : 6
      configuration.titleLineBreakMode = .byTruncatingTail
      applyFontSize(to: &configuration)
      button.configuration = configuration
    }
    // Keep the title on one line; long labels scale down instead of wrapping
    // into a vertical-looking stack inside narrow glass buttons.
    button.titleLabel?.numberOfLines = 1
    button.titleLabel?.adjustsFontSizeToFitWidth = true
    button.titleLabel?.minimumScaleFactor = 0.55
    button.titleLabel?.baselineAdjustment = .alignCenters
    button.isSelected = isControlSelected
    button.isEnabled = !isControlDisabled
  }

  private func applyFontSize(to configuration: inout UIButton.Configuration) {
    guard let fontSize else { return }
    configuration.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
      var outgoing = incoming
      outgoing.font = .systemFont(ofSize: fontSize, weight: .semibold)
      return outgoing
    }
  }

  @objc private func didPress() {
    onPress([:])
  }
}
/** A native glass segmented control built from Apple's UIKit glass buttons. */
public final class NativeLiquidSegmentedView: ExpoView, UIGestureRecognizerDelegate {
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
    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    pan.maximumNumberOfTouches = 1
    pan.delegate = self
    addGestureRecognizer(pan)
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
        configuration.titleLineBreakMode = .byTruncatingTail
        button.configuration = configuration
      } else {
        var configuration = UIButton.Configuration.bordered()
        configuration.title = value
        configuration.contentInsets = NSDirectionalEdgeInsets(top: 5, leading: 8, bottom: 5, trailing: 8)
        configuration.titleLineBreakMode = .byTruncatingTail
        button.configuration = configuration
      }
      button.titleLabel?.numberOfLines = 1
      button.titleLabel?.adjustsFontSizeToFitWidth = true
      button.titleLabel?.minimumScaleFactor = 0.6
      // Match the bottom bar: selected text uses the system tab tint, idle
      // text uses the system secondary label color, and the glass material
      // stays identical to the native tab bar.
      button.configurationUpdateHandler = { button in
        var configuration = button.configuration
        if configuration == nil {
          if #available(iOS 26.0, *) {
            configuration = UIButton.Configuration.glass()
          } else {
            configuration = UIButton.Configuration.bordered()
          }
        }
        guard var configuration else { return }
        configuration.baseForegroundColor = button.isSelected ? .systemBlue : .systemGray
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

  // Dragging across the control switches selection just like the native tab
  // bar, so the gender/calendar rows behave like the bottom bar.
  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    guard !options.isEmpty, !isControlDisabled else { return }
    let width = bounds.width > 0 ? bounds.width : 1
    let segmentWidth = width / CGFloat(options.count)
    let index = min(max(0, Int(gesture.location(in: self).x / segmentWidth)), options.count - 1)
    if index != selectedIndex {
      selectedIndex = index
      applySelection()
      onSelectionChange(["value": options[index]])
    }
  }

  public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let pan = gestureRecognizer as? UIPanGestureRecognizer else { return true }
    let velocity = pan.velocity(in: self)
    return abs(velocity.x) > abs(velocity.y) * 1.3
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
    tabBar.delegate = self
    tabBar.items = tabs.enumerated().map { index, tab in
      UITabBarItem(title: tab.title, image: UIImage(systemName: tab.symbol), tag: index)
    }
    addSubview(tabBar)
  }

  // UITabBar reports an intrinsic size (~320x49). Without this override the
  // host view can collapse to that size instead of filling the React Native
  // frame, which made the native glass bar smaller than the fallback bar.
  public override var intrinsicContentSize: CGSize {
    CGSize(width: UIView.noIntrinsicMetric, height: UIView.noIntrinsicMetric)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    tabBar.frame = bounds
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

/**
 A mini UITabBar used for inline single-choice rows (gender, calendar type).
 It renders the exact same Liquid Glass material and selected state as the
 bottom bar, because it uses the same UIKit UITabBar class.
 */
public final class NativeLiquidSelectorView: ExpoView, UITabBarDelegate, UIGestureRecognizerDelegate {
  let onSelectionChange = EventDispatcher()
  private let tabBar = UITabBar()
  private var options: [String] = []
  private var selectedIndex = 0
  private var isControlDisabled = false

  public required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    tabBar.delegate = self
    tabBar.itemPositioning = .centered
    addSubview(tabBar)
    let pan = UIPanGestureRecognizer(target: self, action: #selector(handlePan(_:)))
    pan.maximumNumberOfTouches = 1
    pan.delegate = self
    addGestureRecognizer(pan)
  }

  public override var intrinsicContentSize: CGSize {
    CGSize(width: UIView.noIntrinsicMetric, height: UIView.noIntrinsicMetric)
  }

  public override func layoutSubviews() {
    super.layoutSubviews()
    tabBar.frame = bounds
  }

  func setOptions(_ values: [String]) {
    options = values
    tabBar.items = values.enumerated().map { index, title in
      UITabBarItem(title: title, image: nil, tag: index)
    }
    selectedIndex = options.isEmpty ? 0 : min(max(selectedIndex, 0), options.count - 1)
    tabBar.selectedItem = tabBar.items?[selectedIndex]
  }

  func setSelectedIndex(_ value: Int) {
    selectedIndex = options.isEmpty ? 0 : min(max(0, value), options.count - 1)
    tabBar.selectedItem = tabBar.items?[selectedIndex]
  }

  func setDisabled(_ value: Bool) {
    isControlDisabled = value
  }

  public func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    guard options.indices.contains(item.tag) else { return }
    selectedIndex = item.tag
    onSelectionChange(["value": options[item.tag]])
  }

  @objc private func handlePan(_ gesture: UIPanGestureRecognizer) {
    guard !options.isEmpty, !isControlDisabled else { return }
    let width = bounds.width > 0 ? bounds.width : 1
    let segmentWidth = width / CGFloat(options.count)
    let index = min(max(0, Int(gesture.location(in: self).x / segmentWidth)), options.count - 1)
    if index != selectedIndex {
      selectedIndex = index
      tabBar.selectedItem = tabBar.items?[index]
      onSelectionChange(["value": options[index]])
    }
  }

  public override func gestureRecognizerShouldBegin(_ gestureRecognizer: UIGestureRecognizer) -> Bool {
    guard let pan = gestureRecognizer as? UIPanGestureRecognizer else { return true }
    let velocity = pan.velocity(in: self)
    return abs(velocity.x) > abs(velocity.y) * 1.3
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
      Prop("fontSize") { (view, value: Double?) in view.setFontSize(value) }
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

public final class NativeLiquidSelectorModule: Module {
  public func definition() -> ModuleDefinition {
    Name("NativeLiquidSelector")
    View(NativeLiquidSelectorView.self) {
      Prop("options") { (view, value: [String]) in view.setOptions(value) }
      Prop("selectedIndex") { (view, value: Int) in view.setSelectedIndex(value) }
      Prop("disabled", false) { (view, value: Bool) in view.setDisabled(value) }
      Events("onSelectionChange")
    }
  }
}
