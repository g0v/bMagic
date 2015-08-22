# bMagic

治癒魔法APP，是為了即時獲得台灣血液存量，且實踐低存量時通知民眾而製作的服務。

- 步驟一：

`ionic platform add android/ios`

`ionic resources`

`ionic plugin add https://github.com/yutin1987/cordovaParselnstallation`

- 步驟二：
寫入`www/js/configs.json`
```
configs = {
  parseId: '',
  parseKey: '',
  gcmSenderID: null // 可為空
};
```

- 步驟三：

`ionic run -l -c`

# License
[MIT License](https://www.openfoundry.org/licenses/34-mit-licensemit)
