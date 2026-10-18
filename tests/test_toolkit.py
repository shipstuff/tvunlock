from pathlib import Path
import sys
import unittest

ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tools'))
from tv import make_plan
from privacy import scan_blob

class CleanupPlanTests(unittest.TestCase):
    def setUp(self):
        self.audit={'system':{'modelName':'EXAMPLE_OLED','sdkVersion':'10.3.2'},
          'apps':[{'id':'example.optional','title':'Optional app','removable':True},
                  {'id':'airplay','title':'AirPlay','removable':True},
                  {'id':'com.webos.app.home','title':'Home','removable':False}],
          'settings':{'general':{'homePromotion':'on','screenSaverAd':'off'}},'demoFiles':[]}
    def test_plan_has_no_implicit_deletions(self):
        plan=make_plan(self.audit)
        self.assertEqual(plan['removeApps'],[])
        self.assertEqual(plan['deleteDemoFiles'],[])
        self.assertEqual(plan['disableSettings'],[])
    def test_protected_and_absent_apps_are_rejected(self):
        for app in ['airplay','com.webos.app.home','missing.app']:
            with self.assertRaises(ValueError):make_plan(self.audit,[app])
    def test_only_explicit_optional_apps_are_planned(self):
        plan=make_plan(self.audit,['example.optional','example.optional'])
        self.assertEqual(plan['removeApps'],[{'id':'example.optional','title':'Optional app'}])
    def test_unsupported_and_already_disabled_settings_are_skipped(self):
        plan=make_plan(self.audit,disable_ads=True)
        self.assertEqual([(s['category'],s['key']) for s in plan['disableSettings']],[('general','homePromotion')])

class PrivacyTests(unittest.TestCase):
    def test_identifiers_are_detected_without_real_identifiers_in_fixtures(self):
        address='.'.join(['10','20','30','40']).encode()
        mac=':'.join(['ab']*6).encode()
        key=('-----BEGIN '+'OPENSSH'+' PRIVATE KEY-----').encode()
        for value in [address,mac,key]:self.assertTrue(scan_blob('example.txt',value))
    def test_private_state_is_rejected_even_with_innocuous_contents(self):
        self.assertIn('private/generated file',scan_blob('.private/audit.json',b'{}'))
    def test_model_and_firmware_are_allowed(self):
        self.assertEqual(scan_blob('compatibility.txt',b'OLED65B2AUA webOS 25 10.3.2-33 firmware 33.31.75'),[])
    def test_required_license_attribution_is_preserved(self):
        email=('copyright'+'@'+'example.org').encode()
        self.assertEqual(scan_blob('launcher/public/licenses/NOTICE.txt',email),[])

if __name__=='__main__':unittest.main()
